import 'express-session';
import { Router } from "express";
import { login, profile } from '../controllers/auth';
import { json, error } from '../utils/route';
import { authenticate } from '../utils/auth';
import { JwtPayload } from 'jsonwebtoken';
import StoryRoute from './story';

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { user, token } = await login(req.body, true);

    if (!user.isAdmin) throw new Error("你没有权限");

    json(res, token);
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


router.use(authenticate((payload: JwtPayload, req, res, next) => {
  next();
}))

router.use("/story", StoryRoute);


export default router;