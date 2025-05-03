import 'express-session';
import svgCaptcha from "svg-captcha";
import { Router } from "express";
import { login, register } from "../controllers/auth";
import { render } from '../utils/route';
import { omit } from '../utils';

const router = Router();

// 用户登录
router.post("/login", async (req, res) => {
  try {
    const { user } = await login(req.body);
    req.session.user = omit(user, ["password"]);
    res.redirect("/");
  } catch (error: any) {
    render(res, 'login', req).title('登录').error(error.message).render();
  }
});

router.post("/token", async (req, res) => {
  try {
    const { token } = await login(req.body, true);
    res.json({ code: 0, data: token });
  } catch (error: any) {
    res.json({ code: -1, message: error.message });
  }
});

// 用户注册
router.post("/register", async (req, res) => {
  try {
    const { username, password, captcha } = req.body;

    // 验证验证码
    if (!req.session.captcha || req.session.captcha.toUpperCase() !== captcha.toUpperCase()) {
      render(res, 'register', req).title('注册').error("验证码错误").render();
      return;
    }

    await register({ username, password });

    render(res, 'login').title('登录').success("Registration successful, please log in").render();
  } catch (error: any) {
    render(res, 'register', req).title('注册').error(error.message).render();
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
router.get("/login", (req, res) => {
  render(res, 'login', req).title('登录').render();
});

// 注册页面
router.get("/register", (req, res) => {
  render(res, 'register', req).title('注册').render();
});

router.get("/logout", (req, res) => {
  delete req.session.user;
  res.redirect("/auth/login");
});

export default router;