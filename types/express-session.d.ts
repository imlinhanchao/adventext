import 'express-session';
import { User } from '../entities/User';
import { GameState } from '../entities/GameState';

declare module 'express-session' {
  interface SessionData {
    user?: User;
    state?: GameState | null;
    captcha?: string;
  }
}