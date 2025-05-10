import { Request, Response } from 'express';
import { Router } from "express";
import { userSession } from "../utils/auth";
import { error, render } from "../utils/route";
import { AppDataSource, Draft, Story, User } from '../entities';

const router = Router();

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