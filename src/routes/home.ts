import { Router } from "express";
import { init, game } from "../controllers/game";
import { userSession } from "../utils/auth";

const router = Router();

router.get("/:storyId", userSession(init));
router.post("/choose/:storyId", userSession(game));

export default router;