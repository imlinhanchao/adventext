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
      const story = await game.getStory(req.params.storyId);
      if (!story || type == 'draft' && story?.author !== user.username) {
        return next();
      }
      render(res, "index", req).title(story.name).render({
        logo: story!.name,
        story,
      })
    } catch (error: any) {
      render(res, 'index', req).error(error.message).render()
    }
  }));
  router.post("/:storyId/init", userSession(async (user: User, req: Request, res: Response) => {
    try {
      const game = new GameController(type);
      const { state, content, scene } = await game.init(user, req, res);
      json(res, {
        scene,
        state,
        content,
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

  if (type === 'draft') {
    router.post("/:storyId/reset", userSession((user: User, req: Request, res: Response, next) => {
      const game = new GameController(type);
      game.resetGame(user, req, res, next)
    }));
  } else {
    router.get("/:storyId/rank", userSession((user: User, req: Request, res: Response, next) => {
      const game = new GameController(type);
      game.rank(user, req, res, next)
    }));
  }

  return router;
}