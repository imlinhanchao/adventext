import 'express-session';
import { Router } from "express";
import { login, profile } from '../controllers/auth';
import { json, error } from '../utils/route';
import { authenticate, generateToken } from '../utils/auth';
import { JwtPayload } from 'jsonwebtoken';
import { ItemRepo, SceneRepo, StoryRepo, User, UserRepo } from '../entities';
import DraftRoute from './draft';
import StoryRoute from './story';
import UserRoute from './user';
import pako from 'pako';
import { In } from 'typeorm';
import { omit } from '../utils';

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

router.get("/storys{/:author}", async (req, res) => {
  try {
    const { index, count } = req.query;
    const author = req.params.author;
    const gzip = req.query.gzip !== undefined;
    const storys = await StoryRepo.find({
      ...(author ? { where: { author }, }: {}),
      order: { createTime: 'DESC' },
      skip: Number(index) || 0,
      take: Number(count) || 10
    });
    const ids = storys.map((story) => story.id);
    const scenes = await SceneRepo.find({
      where: { storyId: In(ids) }
    }).then(scenes => scenes.map((scene) => omit(scene, ['id', 'storyId', 'createTime', 'updateTime'])));
    const items = await ItemRepo.find({
      where: { storyId: In(ids) }
    }).then(items => items.map((item) => omit(item, ['id', 'storyId', 'createTime', 'updateTime'])));

    const rows: any[] = [];
    for (let i = 0; i < storys.length; i++) {
      const story = storys[i];
      const scene = scenes.filter((scene) => scene.storyId === story.id);
      const item = items.filter((item) => item.storyId === story.id);
      const data = {
        ...omit(story, ['id', 'status', 'comment', 'createTime', 'updateTime']),
        scene,
        item
      }

      if (gzip) {
        const utf8Bytes = Buffer.from(JSON.stringify(data), 'utf8');
        const compressed = pako.deflate(utf8Bytes);
        const dataZip = Buffer.from(compressed).toString('base64');
        rows.push(dataZip);
      } else {
        rows.push(data);
      }
    }
    json(res, rows);
  } catch (err: any) {
    error(res, err.message);
  }
})

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