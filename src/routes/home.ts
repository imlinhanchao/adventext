import { Router } from "express";
import { init, game } from "../controllers/game";
import { userSession } from "../utils/auth";

const router = Router();

router.get("/", userSession(init));
router.post("/", userSession(game));

export default router;