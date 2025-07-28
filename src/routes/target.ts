import { Router } from "express";
import { error, json } from "../utils/route";
import { TargetRepo } from "../entities/";
import { updateStoryStatus } from "./scene";

const router = Router();

router.use((req, res, next) => {
  if (req.user && req.story) {
    next();
  } else {
    error(res, "请先登录", 403);
  }
})

// 获取故事所有成就
router.get("/targets", async (req, res) => {
  const story = req.story!;

  const query: any = {};
  if (req.query.type) {
    query.type = req.query.type;
  }
  if (req.query.name) {
    query.name = { $like: `%${req.query.name}%` };
  }

  const targets = await TargetRepo.find({
    where: { 
      storyId: story.id,
      ...query
    }
  });
  json(res, targets);
});

// 添加新成就
router.post("/target", async (req, res) => {
  const story = req.story!;

  const existingItem = await TargetRepo.findOneBy({ key: req.body.key, storyId: story.id });
  if (existingItem) {
    return error(res, "成就已存在" );
  }

  const newItem = TargetRepo.create({ ...req.body, storyId: story.id });
  const result = await TargetRepo.save(newItem);

  updateStoryStatus(req);
  json(res, result);
});

// 更新成就
router.put("/target/:targetId", async (req, res) => {
  const story = req.story!;
  const existingItem = await TargetRepo.findOneBy({ key: req.body.key, storyId: story.id });
  if (existingItem && existingItem.id !== Number(req.params.targetId)) {
    return error(res, "成就已存在" );
  }
  
  const target = await TargetRepo.findOneBy({ id: Number(req.params.targetId), storyId: story.id });
  if (!target) {
    return error(res, "成就不存在" );
  }

  TargetRepo.merge(target, req.body);
  const result = await TargetRepo.save(target);

  updateStoryStatus(req);
  json(res, result);
});

// 删除成就
router.delete("/target/:targetId", async (req, res) => {
  const story = req.story!;
  const result = await TargetRepo.delete({ id: Number(req.params.targetId), storyId: story.id });
  if (result.affected === 0) {
    return error(res, "成就不存在");
  }
  
  updateStoryStatus(req);
  json(res, { message: "成就删除成功" });
});

// 获取成就详情
router.get("/target/:key", async (req, res) => {
  const story = req.story!;
  const target = await TargetRepo.findOneBy({ key: req.params.key, storyId: story.id });
  if (!target) {
    return error(res, "成就不存在" );
  }

  json(res, target);
});

export default router;