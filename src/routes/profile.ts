import { Router } from 'express';
import { getGameState, saveGameState, getUserInfo } from '../controllers/profile';
import { authenticate } from '../utils/auth';

const router = Router();

router.get('/game-state', authenticate(getGameState));
router.post('/game-state', authenticate(saveGameState));
router.get('/user-info', authenticate(getUserInfo));

export default router;