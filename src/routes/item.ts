import { Router } from "express";
import { error, json } from "../utils/route";
import { AppDataSource, Item, Story } from "../entities/";

const router = Router();

// 获取故事所有物品
router.get("/:id/items", async (req, res) => {
  const storyRepository = AppDataSource.getRepository(Story);
  const story = await storyRepository.findOneBy({ id: Number(req.params.id) });
  if (!story) {
    return error(res, "故事不存在" );
  }

  const query: any = {};
  if (req.query.type) {
    query.type = req.query.type;
  }
  if (req.query.name) {
    query.name = { $like: `%${req.query.name}%` };
  }

  const itemRepository = AppDataSource.getRepository(Item);
  const items = await itemRepository.find({
    where: { 
      storyId: Number(req.params.id),
      ...query
    }
  });
  json(res, items);
});

// 添加新物品
router.post("/:id/item", async (req, res) => {
  const storyRepository = AppDataSource.getRepository(Story);
  const story = await storyRepository.findOneBy({ id: Number(req.params.id) });
  if (!story) {
    return error(res, "故事不存在" );
  }

  const itemRepository = AppDataSource.getRepository(Item);
  const newItem = itemRepository.create({ ...req.body, storyId: Number(req.params.id) });
  const result = await itemRepository.save(newItem);

  json(res, result);
});

// 更新物品
router.put("/:id/item/:itemId", async (req, res) => {
  const storyRepository = AppDataSource.getRepository(Story);
  const story = await storyRepository.findOneBy({ id: Number(req.params.id) });
  if (!story) {
    return error(res, "故事不存在" );
  }

  const itemRepository = AppDataSource.getRepository(Item);
  const item = await itemRepository.findOneBy({ id: Number(req.params.itemId), storyId: Number(req.params.id) });
  if (!item) {
    return error(res, "物品不存在" );
  }

  itemRepository.merge(item, req.body);
  const result = await itemRepository.save(item);
  json(res, result);
});

// 删除物品
router.delete("/:id/item/:itemId", async (req, res) => {
  const storyRepository = AppDataSource.getRepository(Story);
  const story = await storyRepository.findOneBy({ id: Number(req.params.id) });
  if (!story) {
    return error(res, "故事不存在" );
  }

  const itemRepository = AppDataSource.getRepository(Item);
  const result = await itemRepository.delete({ id: Number(req.params.itemId), storyId: Number(req.params.id) });
  if (result.affected === 0) {
    return error(res, "物品不存在");
  }
  json(res, { message: "物品删除成功" });
});

// 获取物品详情
router.get("/:id/item/:itemId", async (req, res) => {
  const storyRepository = AppDataSource.getRepository(Story);
  const story = await storyRepository.findOneBy({ id: Number(req.params.id) });
  if (!story) {
    return error(res, "故事不存在" );
  }

  const itemRepository = AppDataSource.getRepository(Item);
  const item = await itemRepository.findOneBy({ id: Number(req.params.itemId), storyId: Number(req.params.id) });
  if (!item) {
    return error(res, "物品不存在" );
  }

  json(res, item);
});

export default router;