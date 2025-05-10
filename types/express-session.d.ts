import 'express-session';
import { User } from '../entities/User';
import { GameState } from '../entities/GameState';
import { Request } from "express";
import { Story } from '../src/entities';

declare module 'express-session' {
  interface SessionData {
    user?: User;
    state?: GameState | null;
    captcha?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
      story?: Story | Draft;
    }
  }
}