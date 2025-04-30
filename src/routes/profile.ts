import { Router } from 'express';
import { getGameState, saveGameState, getUserInfo } from '../controllers/profile';
import { authenticateRequest } from '../utils/auth';

const router = Router();

router.get('/game-state', authenticateRequest(getGameState));
router.post('/game-state', authenticateRequest(saveGameState));
router.get('/user-info', authenticateRequest(getUserInfo));

export default router;