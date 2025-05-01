import { Router } from "express";
import { AppDataSource } from "../entities";
import { Scene } from "../entities/Scene";

const router = Router();

// 获取所有剧情
router.get("/", async (req, res) => {
  const storyRepository = AppDataSource.getRepository(Scene);
  const stories = await storyRepository.find();
  res.json(stories);
});

// 添加新剧情
router.post("/", async (req, res) => {
  const storyRepository = AppDataSource.getRepository(Scene);
  const newStory = storyRepository.create(req.body);
  const result = await storyRepository.save(newStory);
  res.json(result);
});

export default router;