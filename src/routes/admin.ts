import 'express-session';
import { Router } from "express";
import { login, profile } from '../controllers/auth';
import { json, error } from '../utils/route';
import { authenticate, generateToken } from '../utils/auth';
import { JwtPayload } from 'jsonwebtoken';
import { User, UserRepo } from '../entities';
import DraftRoute from './draft';
import StoryRoute from './story';
import UserRoute from './user';

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { token } = await login(req.body, true);

    json(res, token);
  } catch (err: any) {
    error(res, err.message);
  }
});


router.post("/token", async (req, res) => {
  try {
    if (!req.session.user) {
      throw new Error("用户未登录");
    } else {
      json(res, generateToken({ id: req.session.user.id }));
    }
  } catch (err: any) {
    error(res, err.message, 403);
  }
});

router.post('/logout', (req, res) => {
  try {
    req.session.user = null;
    json(res, "退出成功");
  } catch (err: any) {
    error(res, err.message);
  }
});

router.get("/profile", authenticate(async (payload: JwtPayload, req, res) => {
  try {
    json(res, await profile(payload.id));
  } catch (err: any) {
    error(res, err.message);
  }
}));

router.use(authenticate(async (payload: JwtPayload, req, res, next) => {
  try {
    const user = await UserRepo.findOne({ where: { id: payload.id } });
    if (!user) {
      throw new Error("用户不存在");
    }
    req.user = user;

    next();
  } catch (err: any) {
    error(res, err.message);
  }
}))

router.use("/user", UserRoute);
router.use("/draft", DraftRoute);
router.use("/story", StoryRoute);

export default router;