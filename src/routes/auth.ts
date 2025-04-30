import 'express-session';
import bcrypt from "bcrypt";
import svgCaptcha from "svg-captcha";
import { Router } from "express";
import { AppDataSource } from "../entities";
import { User } from "../entities/User";
import { login } from "../controllers/auth";
import { State } from "../entities/State";
import { render } from '../utils/route';

const router = Router();

// 用户登录
router.post("/login", async (req, res) => {
  try {
    const { user } = await login(req.body, true);
    req.session.user = user;

    if (user) {
      const state = await AppDataSource.getRepository(State).findOneBy({ id: user.id });
      req.session.state = state;
    }

    res.redirect("/"); // 登录成功后重定向到主页
  } catch(error: any) {
    render(res, 'login', req).title('登录').error(error.message).render();
  }
});

router.post("/token", async (req, res) => {
  try {
    const { token } = await login(req.body, true);
    res.json({ code: 0, data: token });
  } catch(error: any) {
    res.json({ code: -1, message: error.message });
  }
});

// 用户注册
router.post("/register", async (req, res) => {
  const { username, password, captcha } = req.body;
  const userRepository = AppDataSource.getRepository(User);

  // 验证验证码
  const storedCaptcha = captchas.get(req.sessionID);
  if (!storedCaptcha || storedCaptcha.toUpperCase() !== captcha.toUpperCase()) {
    render(res, 'register').title('注册').error("Invalid captcha").render();
    return;
  }

  const existingUser = await userRepository.findOne({ where: { username } });
  if (existingUser) {
    render(res, 'register').title('注册').error("Username already exists").render();
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = userRepository.create({ username, password: hashedPassword });
  await userRepository.save(newUser);

  render(res, 'login').title('登录').success("Registration successful, please log in").render();
});

const captchas = new Map(); // 存储验证码的 Map

// 验证码生成
router.get("/captcha", (req, res) => {
  const captcha = svgCaptcha.create({
    size: 4, // 验证码长度
    noise: 2, // 干扰线条数
    color: true, // 是否使用彩色
    background: "#ccf2ff", // 背景颜色
  });

  captchas.set(req.sessionID, captcha.text); // 将验证码文本存储到 Map 中
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

export default router;