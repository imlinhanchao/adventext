import { Router } from "express";
import { render } from "../utils/route";

const router = Router();

router.get("/", (req, res) => {
  render(res, "index").render();
});

export default router;