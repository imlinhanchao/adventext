import { Request, Response } from 'express';
import { Router } from "express";
import GameController from "../controllers/game";
import { userSession } from "../utils/auth";
import { error, json, render } from "../utils/route";
import { AppDataSource, Draft, Story, User } from '../entities';
import { isNumber } from '../utils/is';

const router = Router();
const game = new GameController('story');

router.get("/:username", userSession(async (user: User, req: Request, res: Response) => {
  const username = req.params.username;
  let account;
  let stories;
  if (user && user.username === username) {
    if (req.query.type === 'draft') {
      const draftRepository = AppDataSource.getRepository(Draft);
      stories = await draftRepository.find({
        where: {
          author: user.username,
        }
      })
    }
    account = user
  } else {
    const userRepository = AppDataSource.getRepository(User);
    account = await userRepository.findOneBy({ username });
    if (!account) {
      return error(res, "用户不存在", 404);
    }
  }

  if (user.username !== username || req.query.type !== 'draft') {
    const storyRepository = AppDataSource.getRepository(Story);
    stories = await storyRepository.find({
      where: {
        author: username,
      }
    });
  }

  render(res, "profile", req).title(user.username).render({
    stories,
    account,
  })
}));

export default router;