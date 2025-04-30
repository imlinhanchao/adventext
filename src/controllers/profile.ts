import { JwtPayload } from 'jsonwebtoken';
import { Request, Response } from 'express';
import { AppDataSource } from '../entities';
import { GameState } from '../entities/GameState';
import { User } from '../entities/User';

const gameStateRepository = AppDataSource.getRepository(GameState);

export const getGameState = async (payload: JwtPayload, req: Request, res: Response) => {
  try {
    const userId = payload.id;

    const gameState = await gameStateRepository.findOneBy({ id: userId });

    if (!gameState) {
      return res.status(404).json({ message: 'GameState not found' });
    }

    res.json(gameState);
  } catch (error: any) {
    res.status(error.message.includes('Unauthorized') ? 401 : 500).json({ message: error.message });
  }
};

export const saveGameState = async (payload: JwtPayload, req: Request, res: Response) => {
  try {
    const userId = payload.id;
    const { currentScene, inventory, gold } = req.body;

    let gameState = await gameStateRepository.findOneBy({ id: userId });

    if (!gameState) {
      gameState = new GameState();
      gameState.id = userId;
    }

    gameState.currentScene = currentScene;
    gameState.inventory = inventory;
    gameState.gold = gold;

    await gameStateRepository.save(gameState);

    res.json({ message: 'GameState saved successfully' });
  } catch (error: any) {
    res.status(error.message.includes('Unauthorized') ? 401 : 500).json({ message: error.message });
  }
};

export const getUserInfo = async (payload: JwtPayload, req: Request, res: Response) => {
  try {
    const userId = payload.id;

    const user = await AppDataSource.getRepository(User).findOneBy({ id: userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ id: user.id, username: user.username });
  } catch (error: any) {
    res.status(error.message.includes('Unauthorized') ? 401 : 500).json({ message: error.message });
  }
};