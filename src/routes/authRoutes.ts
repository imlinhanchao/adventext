import { Router } from "express";
import { AppDataSource } from "../index";
import { User } from "../entities/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = Router();

// 用户登录
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { username } });

  if (!user) {
    res.json({ message: "Invalid credentials" });
    return;
  }

  const isValid = await bcrypt.compare(password, user.password!);
  if (!isValid) {
    res.json({ message: "Invalid credentials" });
    return;
  }

  const token = jwt.sign({ id: user.id }, "secret", { expiresIn: "1h" });
  res.json({ token });
});

export default router;