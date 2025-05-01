import { JwtPayload } from 'jsonwebtoken';
import { Request, Response } from 'express';
import { AppDataSource } from '../entities';
import { State } from '../entities/Profile';
import { User } from '../entities/User';
import { omit } from '../utils';
import { error, json } from '../utils/route';


export const getGameState = async (payload: JwtPayload, req: Request, res: Response) => {
  try {
    const userId = payload.id;
    
    const gameStateRepository = AppDataSource.getRepository(State);
    const gameState = await gameStateRepository.findOneBy({ id: userId });

    if (!gameState) {
      return json(res, new State());
    }

    json(res, gameState);
  } catch (error: any) {
    error(res, error.message);
  }
};

export const saveGameState = async (payload: JwtPayload, req: Request, res: Response) => {
  try {
    const userId = payload.id;
    const { currentScene, inventory, gold } = req.body;

    const gameStateRepository = AppDataSource.getRepository(State);
    let gameState = await gameStateRepository.findOneBy({ id: userId });

    if (!gameState) {
      gameState = new State();
      gameState.id = userId;
    }

    gameState.currentScene = currentScene;
    gameState.inventory = inventory;
    gameState.gold = gold;

    await gameStateRepository.save(gameState);

    json(res, null, 'GameState saved successfully');
  } catch (error: any) {
    error(res, error.message);
  }
};

export const getUserInfo = async (payload: JwtPayload, req: Request, res: Response) => {
  try {
    const userId = payload.id;

    const user = await AppDataSource.getRepository(User).findOneBy({ id: userId });

    if (!user) {
      return error(res, 'User not found');
    }

    json(res, omit(user, ['password']));
  } catch (error: any) {
    error(res, error.message);
  }
};