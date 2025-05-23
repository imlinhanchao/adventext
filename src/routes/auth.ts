import 'express-session';
import svgCaptcha from "svg-captcha";
import { Router } from "express";
import { login, register } from "../controllers/auth";
import { render } from '../utils/route';
import ThirdPartyInstance from '../controllers/third';
import { User, UserRepo } from '../entities';
import { omit } from '../utils';

const router = Router();

// 用户登录
router.post("/login", async (req, res) => {
  try {
    const { user } = await login(req.body);
    req.session.user = user;
    req.session.save();
    res.redirect("/");
  } catch (error: any) {
    const thirds = await ThirdPartyInstance.getAll();
    render(res, 'login', req).title('登录').error(error.message).render({ thirds });
  }
});

// 用户注册
router.post("/register", async (req, res) => {
  const thirds = await ThirdPartyInstance.getAll();
  try {
    const { username, password, captcha } = req.body;

    // 验证验证码
    if (!req.session.captcha || req.session.captcha.toUpperCase() !== captcha.toUpperCase()) {
      throw new Error("验证码错误")
    }

    await register({ username, password });

    render(res, 'login').title('登录').success("注册成功！请登录账号。").render({ thirds });
  } catch (error: any) {
    render(res, 'register', req).title('注册').error(error.message).render({ thirds });
  }
});

// 验证码生成
router.get("/captcha", (req, res) => {
  const captcha = svgCaptcha.create({
    size: 4, // 验证码长度
    noise: 2, // 干扰线条数
    color: false, // 是否使用彩色
    background: "#ffffff", // 背景颜色
  });

  req.session.captcha = captcha.text; // 将验证码文本存储到 Map 中
  res.type("svg");
  res.status(200).send(captcha.data); // 返回验证码的 SVG 数据
});

// 登录页面
router.get("/login", async (req, res) => {
  const thirds = await ThirdPartyInstance.getAll();
  render(res, 'login', req).title('登录').render({ thirds });
});

// 注册页面
router.get("/register", async (req, res) => {
  const thirds = await ThirdPartyInstance.getAll();
  render(res, 'register', req).title('注册').render({ thirds });
});

router.get("/logout", (req, res) => {
  delete req.session.user;
  res.redirect("/auth/login");
});

router.get("/third/:id/login", async (req, res) => {
  try {
    const third = new ThirdPartyInstance(parseInt(req.params.id as string), req.query);
    const user = await third.login();
    let userInstance = await UserRepo.findOneBy({ username: user.username });
    if (!userInstance) {
      await UserRepo.save(user);
      userInstance = await UserRepo.findOneBy({ username: user.username });
    } else {
      userInstance.attr = user.attr;
      await UserRepo.save(userInstance);
    }
    req.session.user = omit(userInstance, User.unsafeKey);
    req.session.save();
    res.redirect("/");
  } catch (error: any) {
    const thirds = await ThirdPartyInstance.getAll();
    render(res, 'login', req).title('登录').error(error.message).render({ thirds });
  }
})

router.get("/third/:id", async (req, res) => {
  const { id } = req.params;
  const third = new ThirdPartyInstance(parseInt(id), {});
  await third.waited;
  const { authUrl, authParams } = third.instance;
  const url = new URL(authUrl);
  Object.entries(authParams).forEach(([key, value]) => {
    if (value.includes("$callback")) {
      value = value.replace("$callback", `${req.protocol}://${req.get("host")}/auth/third/${id}/login`);
    }
    url.searchParams.append(key, value);
  });
  res.redirect(url.toString());
});

export default router;