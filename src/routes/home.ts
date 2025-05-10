import { Request, Response } from 'express';
import { Router } from "express";
import GameController from "../controllers/game";
import { userSession } from "../utils/auth";
import { error, json, render } from "../utils/route";
import { User } from '../entities';
import { isNumber } from '../utils/is';

const router = Router();
const game = new GameController('story');

router.get("/", userSession(game.storyList));
router.get("/profile", userSession(async (user: User, req: Request, res: Response) => {
  render(res, "profile", req).title(user.username).render()
}));
router.get("/:storyId", userSession(async (user: User, req: Request, res: Response, next) => {
  try {
    if (!isNumber(Number(req.params.storyId))) {
      next?.();
      return;
    }
    const { state, story, scene } = await game.init(user, req, res);
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
    const { state, scene } = await game.init(user, req, res);
    json(res, {
      scene,
      state,
    })
  } catch (err: any) {
    error(res, err.message)
  }
}));
router.post("/:storyId/choose", userSession((user: User, req: Request, res: Response) => game.game(user, req, res)));
router.post("/:storyId/restart", userSession((user: User, req: Request, res: Response) => game.restartGame(user, req, res)));

export default router;