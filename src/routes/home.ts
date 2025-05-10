import { Request, Response } from 'express';
import { Router } from "express";
import GameController from "../controllers/game";
import { userSession } from "../utils/auth";
import { error, json, render } from "../utils/route";
import { User } from '../entities';
import { isNumber } from '../utils/is';

const router = Router();

router.get("/", userSession((user: User, req: Request, res: Response) => new GameController('story').storyList(req, res)));
router.get("{/:type}/:storyId", userSession(async (user: User, req: Request, res: Response, next) => {
  try {
    if (!isNumber(Number(req.params.storyId))) {
      next?.();
      return;
    }
    if (req.params.type !== 'd' && req.params.type) return next();
    const type = req.params.type == 'd' ? 'draft' : 'story';
    const game = new GameController(type);
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
router.post("{/:type}/:storyId/init", userSession(async (user: User, req: Request, res: Response) => {
  try {
    const type = req.params.type == 'd' ? 'draft' : 'story';
    const game = new GameController(type);
    const { state, scene } = await game.init(user, req, res);
    json(res, {
      scene,
      state,
    })
  } catch (err: any) {
    error(res, err.message)
  }
}));
router.post("{/:type}/:storyId/choose", userSession((user: User, req: Request, res: Response) => {
  const type = req.params.type == 'd' ? 'draft' : 'story';
  const game = new GameController(type);
  game.game(user, req, res)
}));
router.post("{/:type}/:storyId/restart", userSession((user: User, req: Request, res: Response) => {
  const type = req.params.type == 'd' ? 'draft' : 'story';
  const game = new GameController(type);
  game.restartGame(user, req, res)
}));

export default router;