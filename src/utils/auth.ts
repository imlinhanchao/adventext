import jwt, { JwtPayload } from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';

const SECRET_KEY = 'your-secret-key';

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

export function authenticateRequest (subApplication: (payload: JwtPayload, req: Request, res: Response, next?: NextFunction) => any): any {
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