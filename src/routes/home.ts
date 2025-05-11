import { Request, Response } from 'express';
import { Router } from "express";
import GameController from "../controllers/game";
import { userSession } from "../utils/auth";
import { User } from '../entities';
import { createRouter } from './loader';

const router = Router();

router.get("/", userSession((user: User, req: Request, res: Response) => new GameController('story').storyList(req, res)));
router.use('/d', createRouter('draft'));
router.use('/s', createRouter('story'));

export default router;