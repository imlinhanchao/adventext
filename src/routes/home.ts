import { Request, Response } from 'express';
import { Router } from "express";
import { init, game, storyList, restartGame } from "../controllers/game";
import { userSession } from "../utils/auth";
import { render } from "../utils/route";
import { User } from '../entities';

const router = Router();

router.get("/", userSession(storyList));
router.get("/profile", userSession(async (user: User, req: Request, res: Response) => {
  render(res, "profile", req).title(user.username).render()
}));
router.get("/:storyId", userSession(init));
router.post("/:storyId/choose", userSession(game));
router.post("/:storyId/restart", userSession(restartGame));

export default router;