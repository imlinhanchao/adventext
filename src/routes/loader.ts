import { Request, Response } from 'express';
import { Router } from "express";
import GameController from "../controllers/game";
import { userSession } from "../utils/auth";
import { User } from '../entities';
import { error, json, render } from "../utils/route";

export function createRouter(type: string) {
  const router = Router();
  router.get("/:storyId", userSession(async (user: User, req: Request, res: Response, next) => {
    try {
      const game = new GameController(type);
      const { state, story, scene } = await game.init(user, req, res);
      if (!story || type == 'draft' && story?.author !== user.username) {
        return next();
      }
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
      const game = new GameController(type);
      const { state, story, scene } = await game.init(user, req, res);
      json(res, {
        scene,
        state,
      })
    } catch (err: any) {
      error(res, err.message)
    }
  }));
  router.post("/:storyId/choose", userSession((user: User, req: Request, res: Response) => {
    const game = new GameController(type);
    game.game(user, req, res)
  }));
  router.post("/:storyId/restart", userSession((user: User, req: Request, res: Response) => {
    const game = new GameController(type);
    game.restartGame(user, req, res)
  }));

  return router;
}