import jwt, { JwtPayload } from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import utils from './index'
import { User } from '../entities';

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

export function authenticate (subApplication: (payload: JwtPayload, req: Request, res: Response, next?: NextFunction) => any): any {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new Error('Unauthorized: No token provided');
    }

    const payload = verifyToken(token);
    if (!payload || typeof payload === 'string') {
      throw new Error('Unauthorized: Invalid token');
    }

    subApplication(payload, req, res, next)
  }
}

export function userSession (subApplication: (user: User, req: Request, res: Response, next?: NextFunction) => any) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user) {
      res.redirect('/auth/login');
      return;
    }

    subApplication(req.session.user, req, res, next)
  }
}