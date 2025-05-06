import { Request, Response } from 'express';
import { Router } from "express";
import { init, game, storyList, restartGame } from "../controllers/game";
import { userSession } from "../utils/auth";
import { error, json, render } from "../utils/route";
import { User } from '../entities';
import { isNumber } from '../utils/is';

const router = Router();

router.get("/", userSession(storyList));
router.get("/profile", userSession(async (user: User, req: Request, res: Response) => {
  render(res, "profile", req).title(user.username).render()
}));
router.get("/:storyId", userSession(async (user: User, req: Request, res: Response, next) => {
  try {
    if (!isNumber(Number(req.params.storyId))) {
      next?.();
      return;
    }
    const { state, story, scene } = await init(user, req, res);
    render(res, "index", req).title(story!.name).render({
      logo: story!.name,
      scene,
      state,
      story,
    })
  } catch (error: any) {
    render(res, 'index', req).error(error.message).render()
  }
}));
router.post("/:storyId/init", userSession(async (user: User, req: Request, res: Response) => {
  try {
    const { state, scene } = await init(user, req, res);
    json(res, {
      scene,
      state,
    })
  } catch (err: any) {
    error(res, err.message)
  }
}));
router.post("/:storyId/choose", userSession(game));
router.post("/:storyId/restart", userSession(restartGame));

export default router;