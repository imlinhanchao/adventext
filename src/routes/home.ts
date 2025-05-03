import { Router } from "express";
import { init, game, storyList, restartGame } from "../controllers/game";
import { userSession } from "../utils/auth";

const router = Router();

router.get("/", userSession(storyList));
router.get("/:storyId", userSession(init));
router.post("/:storyId/choose", userSession(game));
router.post("/:storyId/restart", userSession(restartGame));

export default router;