import pako from "pako";
import { Router, Request, Response } from "express";
import GameController from "../controllers/game";
import { ItemRepo, SceneRepo, Story, StoryRepo } from "../entities/";
import { error, json } from "../utils/route";
import SceneRoute from './scene';
import ItemRoute from './item';
import TargetRoute from './target';
import { omit } from "../utils";
import { Not } from "typeorm";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Story
 *   description: 已发布故事相关操作
 */

/**
 * @swagger
 * /api/story/run:
 *   post:
 *     summary: 运行故事游戏
 *     tags: [Story]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profile:
 *                 $ref: '#/components/schemas/Profile'
 *               scene:
 *                 $ref: '#/components/schemas/Scene'
 *     responses:
 *       200:
 *         description: 游戏运行结果
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 */
router.post("/run", (req: Request, res: Response) => new GameController('story').gameVirtual(req, res));

/**
 * @swagger
 * /api/story/filter:
 *   post:
 *     summary: 筛选选项
 *     tags: [Story]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profile:
 *                 $ref: '#/components/schemas/Profile'
 *               scene:
 *                 $ref: '#/components/schemas/Scene'
 *               timezone:
 *                 type: integer
 *               records:
 *                 type: array
 *                 items:
 *                   type: object
 *                   $ref: '#/components/schemas/Record'
 *               achievements:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Achievement'
 *               circle:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 筛选后的选项
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 */
router.post("/filter", (req: Request, res: Response) => new GameController('story').optionFilter(req, res));

router.use((req, res, next) => {
  if (req.user?.isAdmin) {
    next();
  } else {
    error(res, "权限不足", 403);
  }
})

// 获取所有故事
/**
 * @swagger
 * /api/story/list:
 *   get:
 *     summary: 获取故事列表
 *     tags: [Story]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 故事列表
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
 *                         $ref: '#/components/schemas/Story'
 */
router.get("/list", async (req, res) => {
  const query: any = {};
  const stories = await StoryRepo.find({
    where: query
  });
  json(res, stories);
});

// 添加新故事
/**
 * @swagger
 * /api/story:
 *   post:
 *     summary: 创建新故事
 *     tags: [Story]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             $ref: '#/components/schemas/Story'
 *     responses:
 *       200:
 *         description: 故事已创建
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Story'
 */
router.post("/", async (req, res) => {
  req.body.author = req.user?.username;
  const newStory = StoryRepo.create(req.body as Story);
  if (newStory.alias) {
    const existing = await StoryRepo.findOneBy({ alias: newStory.alias });
    if (existing) {
      return error(res, "别名已被占用，请更换别名");
    }
  }
  const result = await StoryRepo.save(newStory);
  json(res, result);
});

router.use('/:id', async (req, res, next) => {
  const story = await StoryRepo.findOne({
    where: [{ id: req.params.id }, { alias: req.params.id }]
  });
  if (!story) {
    return next();
  }
  req.story = story;

  next();
})

// 获取故事详情
/**
 * @swagger
 * /api/story/{id}:
 *   get:
 *     summary: 获取故事详情
 *     tags: [Story]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 故事 ID 或别名
 *     responses:
 *       200:
 *         description: 故事详情
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Story'
 */
router.get("/:id", async (req, res) => {
  json(res, req.story);
});

// 更新故事
/**
 * @swagger
 * /api/story/{id}:
 *   put:
 *     summary: 更新故事
 *     tags: [Story]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 故事 ID 或别名
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             $ref: '#/components/schemas/Story'
 *     responses:
 *       200:
 *         description: 故事已更新
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Story'
 */
router.put("/:id", async (req, res) => {
  const story = req.story! as Story;
  if (req.body.alias) {
    const existing = await StoryRepo.findOneBy({ alias: req.body.alias, id: Not(story.id) });
    if (existing) {
      return error(res, "别名已被占用，请更换别名");
    }
  }

  StoryRepo.merge(story!, req.body);
  const result = await StoryRepo.save(story);
  json(res, result);
});

// 删除故事
/**
 * @swagger
 * /api/story/{id}:
 *   delete:
 *     summary: 删除故事
 *     tags: [Story]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 故事 ID
 *     responses:
 *       200:
 *         description: 故事已删除
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
router.delete("/:id", async (req, res) => {
  const story = req.story!;
  const result = await StoryRepo.delete({ id: story.id });
  if (result.affected === 0) {
    return error(res, "故事不存在");
  }
  json(res, { message: "故事删除成功" });
});

/**
 * @swagger
 * /api/story/{id}/export:
 *   get:
 *     summary: 导出故事数据
 *     tags: [Story]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 故事 ID
 *     responses:
 *       200:
 *         description: 已导出的故事数据
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 */
router.get('/:id/export', async (req, res) => {
  const story = req.story!;
  const scenes = await SceneRepo.find({
    where: { storyId: story.id }
  }).then(scenes => scenes.map((scene) => omit(scene, ['id', 'storyId', 'createTime', 'updateTime'])));
  const items = await ItemRepo.find({
    where: { storyId: story.id }
  }).then(items => items.map((item) => omit(item, ['id', 'storyId', 'createTime', 'updateTime'])));
  const achievements = await ItemRepo.find({
    where: { storyId: story.id }
  }).then(items => items.map((item) => omit(item, ['id', 'storyId', 'createTime', 'updateTime'])));

  json(res, {
    ...omit(story, ['id', 'status', 'comment', 'createTime', 'updateTime', 'sourceId']),
    scenes,
    items,
    achievements,
  });
});

/**
 * @swagger
 * /api/story/{id}/package:
 *   get:
 *     summary: 获取压缩的故事包
 *     tags: [Story]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 故事 ID
 *     responses:
 *       200:
 *         description: 压缩的故事包
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: string
 */
router.get('/:id/package', async (req, res) => {
  const story = req.story!;
  const scenes = await SceneRepo.find({
    where: { storyId: story.id }
  }).then(scenes => scenes.map((scene) => omit(scene, ['id', 'storyId', 'createTime', 'updateTime'])));
  const items = await ItemRepo.find({
    where: { storyId: story.id }
  }).then(items => items.map((item) => omit(item, ['id', 'storyId', 'createTime', 'updateTime'])));
  const achievements = await ItemRepo.find({
    where: { storyId: story.id }
  }).then(items => items.map((item) => omit(item, ['id', 'storyId', 'createTime', 'updateTime'])));

  const data = {
    ...omit(story, ['id', 'status', 'comment', 'createTime', 'updateTime']),
    scenes,
    items,
    achievements,
  }

  const utf8Bytes = Buffer.from(JSON.stringify(data), 'utf8');
  const compressed = pako.deflate(utf8Bytes);
  const dataZip = Buffer.from(compressed).toString('base64');

  json(res, dataZip);
});

router.use('/:id', SceneRoute);
router.use('/:id', ItemRoute);
router.use('/:id', TargetRoute);

export default router;