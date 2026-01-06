import { Router } from "express";
import { error, json } from "../utils/route";
import { TargetRepo } from "../entities/";
import { updateStoryStatus } from "./scene";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Target
 *   description: 成就/目标管理
 */

router.use((req, res, next) => {
  if (req.user && req.story) {
    next();
  } else {
    error(res, "请先登录", 403);
  }
})

// 获取故事所有成就
/**
 * @swagger
 * /api/draft/{id}/targets:
 *   get:
 *     summary: 获取所有成就
 *     tags: [Target]
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
 *         description: 成就列表
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
 *                         $ref: '#/components/schemas/Target'
 */
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
/**
 * @swagger
 * /api/draft/{id}/target:
 *   post:
 *     summary: 创建新成就
 *     tags: [Target]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 故事 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Target'
 *     responses:
 *       200:
 *         description: 成就已创建
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Target'
 */
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
/**
 * @swagger
 * /api/draft/{id}/target/{targetId}:
 *   put:
 *     summary: 更新成就
 *     tags: [Target]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Target'
 *     responses:
 *       200:
 *         description: 成就已更新
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Target'
 */
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
/**
 * @swagger
 * /api/draft/{id}/target/{targetId}:
 *   delete:
 *     summary: 删除成就
 *     tags: [Target]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: targetId
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
/**
 * @swagger
 * /api/draft/{id}/target/{key}:
 *   get:
 *     summary: 获取成就详情
 *     tags: [Target]
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
 *         description: 成就详情
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Target'
 */
router.get("/target/:key", async (req, res) => {
  const story = req.story!;
  const target = await TargetRepo.findOneBy({ key: req.params.key, storyId: story.id });
  if (!target) {
    return error(res, "成就不存在" );
  }

  json(res, target);
});

export default router;