import crypto from "crypto";
import { Request, Response } from 'express';
import { Router } from "express";
import { userSession } from "../utils/auth";
import { error, render } from "../utils/route";
import { DraftRepo, StoryRepo, User, UserRepo } from '../entities';
import utils, { omit } from "../utils";

const router = Router();

async function getStories(user: User, req: Request, res: Response) {
  let stories;
  const username = req.params.username;
  if (user && user.username === username) {
    if (req.query.type === 'draft') {
      stories = await DraftRepo.find({
        where: {
          author: user.username,
        }
      })
    }
  }

  if (user.username !== username || req.query.type !== 'draft') {
    stories = await StoryRepo.find({
      where: {
        author: username,
      }
    });
  }

  return stories;
}

router.get("/:username", userSession(async (user: User, req: Request, res: Response, next) => {
  const username = req.params.username;
  let account;
  
  if (!user || user.username !== username) {
    account = await UserRepo.findOneBy({ username });
    if (!account) {
      return next();
    }
  } else {
    account = user;
  }

  const stories = await getStories(user, req, res);

  render(res, "profile", req).title(user.username).render({
    stories,
    account,
  })
}));

router.post('/:username', userSession(async (user: User, req: Request, res: Response, next) => {
  const username = req.params.username;
  let account = await UserRepo.findOneBy({ username });
  if (!account) {
      return next();
  }

  if (user.username === username) {
    let { password, username: _, nickname, oldpassword } = req.body;
    if (password) {
      const oldpasswordHash = crypto.createHash('sha256').update(oldpassword + utils.config.secret.salt).digest('hex');
      if (oldpasswordHash !== account.password) {
        const stories = await getStories(user, req, res);
        return render(res, "profile", req).title(user.username).error('旧密码错误').render({
          stories,
          account,
        })
      }
      account.password = crypto.createHash('sha256').update(password + utils.config.secret.salt).digest('hex');
    }
  
    account.nickname = nickname;
  
    account = await UserRepo.save(account);
    req.session.user = omit(account, User.unsafeKey);
    req.session.save();
    res.redirect('/u/' + username);
  } else {
    const stories = await getStories(user, req, res);
    render(res, "profile", req).title(user.username).error('权限不足').render({
      stories,
      account,
    })
  }
}));


export default router;