import { Router } from "express";
import { error, json } from "../utils/route";
import { ItemRepo } from "../entities/";
import { updateStoryStatus } from "./scene";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Item
 *   description: 物品管理
 */

router.use((req, res, next) => {
  if (req.user && req.story) {
    next();
  } else {
    error(res, "请先登录", 403);
  }
})

// 获取故事所有物品
/**
 * @swagger
 * /api/draft/{id}/items:
 *   get:
 *     summary: 获取所有物品
 *     tags: [Item]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 故事 ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 物品列表
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Item'
 */
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

/**
 * @swagger
 * /api/draft/{id}/items/bulk:
 *   post:
 *     summary: 批量创建或更新物品
 *     tags: [Item]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/Item'
 *     responses:
 *       200:
 *         description: 物品已创建
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Item'
 */
router.post("/items/bulk", async (req, res) => {
  const story = req.story!;
  const itemsData = req.body as any[];
  const createdItems: any[] = [];
  const updateItems: any[] = [];

  for (const itemData of itemsData) {
    const item = await ItemRepo.findOneBy({ key: itemData.key, storyId: story.id });
    if (item) {
      ItemRepo.merge(item, itemData);
      updateItems.push(item);
    } else createdItems.push(itemData);
  }

  const items = ItemRepo.create(createdItems.map(data => ({ ...data, storyId: story.id })));
  await ItemRepo.save(items);

  if (updateItems.length > 0) {
    await ItemRepo.save(updateItems);
  }

  if (createdItems.length > 0) {
    updateStoryStatus(req);
  }

  json(res, createdItems);
});

// 添加新物品
/**
 * @swagger
 * /api/draft/{id}/item:
 *   post:
 *     summary: 创建新物品
 *     tags: [Item]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Item'
 *     responses:
 *       200:
 *         description: 物品已创建
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Item'
 */
router.post("/item", async (req, res) => {
  const story = req.story!;

  if (await ItemRepo.findOneBy({ key: req.body.key, storyId: story.id })) {
    return error(res, "物品已存在" );
  }

  const newItem = ItemRepo.create({ ...req.body, storyId: story.id });
  const result = await ItemRepo.save(newItem);

  updateStoryStatus(req);
  json(res, result);
});

// 更新物品
/**
 * @swagger
 * /api/draft/{id}/item/{itemId}:
 *   put:
 *     summary: 更新物品
 *     tags: [Item]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Item'
 *     responses:
 *       200:
 *         description: 物品已更新
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Item'
 */
router.put("/item/:itemId", async (req, res) => {
  const story = req.story!;
  const existingItem = await ItemRepo.findOneBy({ key: req.body.key, storyId: story.id });
  if (existingItem && existingItem.id !== Number(req.params.itemId)) {
    return error(res, "物品已存在" );
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
/**
 * @swagger
 * /api/draft/{id}/item/{itemId}:
 *   delete:
 *     summary: 删除物品
 *     tags: [Item]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 删除确认
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         message:
 *                           type: string
 */
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
/**
 * @swagger
 * /api/draft/{id}/item/{key}:
 *   get:
 *     summary: 获取物品详情
 *     tags: [Item]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 物品详情
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Item'
 */
router.get("/item/:key", async (req, res) => {
  const story = req.story!;
  const item = await ItemRepo.findOneBy({ key: req.params.key, storyId: story.id });
  if (!item) {
    return error(res, "物品不存在" );
  }

  json(res, item);
});

/**
 * @swagger
 * /api/draft/{id}/item/types:
 *   get:
 *     summary: 获取所有物品类型
 *     tags: [Item]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 类型列表
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: string
 */
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

/**
 * @swagger
 * /api/draft/{id}/item/attrs:
 *   get:
 *     summary: 获取所有物品属性键
 *     tags: [Item]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 属性列表
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: string
 */
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