import jwt, { JwtPayload } from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import utils from './index'
import { User } from '../entities';
import { error } from './route';

const SECRET_KEY = utils.config?.secret.jwt || '';

export function verifyToken (token: string): JwtPayload | null {
  try {
    return jwt.verify(token, SECRET_KEY) as JwtPayload;
  } catch (error) {
    return null;
  }
}

export function generateToken (payload: object) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '7d' });
}

export function authenticate (subApplication: (payload: JwtPayload, req: Request, res: Response, next: NextFunction) => any): any {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token && !req.session.user) {
        throw new Error('Unauthorized: No token provided');
      }

      if (!token) {
        subApplication({ id: req.session.user.id }, req, res, next)
        return;
      }

      const payload = verifyToken(token);
      if (!payload || typeof payload === 'string') {
        throw new Error('Unauthorized: Invalid token');
      }

      subApplication(payload, req, res, next)
    } catch (err: any) {
      error(res, err.message, 403)
    }
  }
}

export function userSession (subApplication: (user: User, req: Request, res: Response, next: NextFunction) => any) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user) {
      res.redirect('/auth/login');
      return;
    }

    subApplication(req.session.user, req, res, next)
  }
}