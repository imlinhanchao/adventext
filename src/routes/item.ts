import { Router } from "express";
import { error, json } from "../utils/route";
import { ItemRepo } from "../entities/";
import { updateStoryStatus } from "./scene";

const router = Router();

router.use((req, res, next) => {
  if (req.user && req.story) {
    next();
  } else {
    error(res, "请先登录", 403);
  }
})

// 获取故事所有物品
router.get("/items", async (req, res) => {
  const story = req.story!;

  const query: any = {};
  if (req.query.type) {
    query.type = req.query.type;
  }
  if (req.query.name) {
    query.name = { $like: `%${req.query.name}%` };
  }

  const items = await ItemRepo.find({
    where: { 
      storyId: story.id,
      ...query
    }
  });
  json(res, items);
});

// 添加新物品
router.post("/item", async (req, res) => {
  const story = req.story!;

  const existingItem = await ItemRepo.findOneBy({ name: req.body.name, storyId: story.id });
  if (existingItem) {
    return error(res, "物品名称已存在" );
  }

  const newItem = ItemRepo.create({ ...req.body, storyId: story.id });
  const result = await ItemRepo.save(newItem);

  updateStoryStatus(req);
  json(res, result);
});

// 更新物品
router.put("/item/:itemId", async (req, res) => {
  const story = req.story!;
  const existingItem = await ItemRepo.findOneBy({ name: req.body.name, storyId: story.id });
  if (existingItem && existingItem.id !== Number(req.params.itemId)) {
    return error(res, "物品名称已存在" );
  }
  
  const item = await ItemRepo.findOneBy({ id: Number(req.params.itemId), storyId: story.id });
  if (!item) {
    return error(res, "物品不存在" );
  }

  ItemRepo.merge(item, req.body);
  const result = await ItemRepo.save(item);

  updateStoryStatus(req);
  json(res, result);
});

// 删除物品
router.delete("/item/:itemId", async (req, res) => {
  const story = req.story!;
  const result = await ItemRepo.delete({ id: Number(req.params.itemId), storyId: story.id });
  if (result.affected === 0) {
    return error(res, "物品不存在");
  }
  
  updateStoryStatus(req);
  json(res, { message: "物品删除成功" });
});

// 获取物品详情
router.get("/item/:key", async (req, res) => {
  const story = req.story!;
  const item = await ItemRepo.findOneBy({ key: req.params.key, storyId: story.id });
  if (!item) {
    return error(res, "物品不存在" );
  }

  json(res, item);
});

router.get("/item/types", async (req, res) => {
  const story = req.story!;
  const items = await ItemRepo.find({
    where: { 
      storyId: story.id
    }
  });

  const types = [...new Set(items.map(item => item.type))];
  json(res, types);
});

router.get("/item/attrs", async (req, res) => {
  const story = req.story!;

  const items = await ItemRepo.find({
    where: { 
      storyId: story.id
    }
  });

  const attrs = items.map(item => Object.keys(item.attributes)).flat();
  json(res, Array.from(new Set(attrs)));
})


export default router;