import pako from "pako";
import { Router, Request, Response } from "express";
import GameController from "../controllers/game";
import { StoryRepo, DraftRepo, SceneRepo, ItemRepo, TargetRepo } from "../entities/";
import { error, json } from "../utils/route";
import SceneRoute from './scene';
import ItemRoute from './item';
import TargetRoute from './target';
import { omit, pick } from "../utils";
import { In, Not } from "typeorm";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Draft
 *   description: 草稿相关操作
 */

/**
 * @swagger
 * /api/draft/run:
 *   post:
 *     summary: 运行草稿游戏
 *     tags: [Draft]
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
 *         description: 游戏执行结果
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
router.post("/run", (req: Request, res: Response) => new GameController('draft').gameVirtual(req, res));

/**
 * @swagger
 * /api/draft/filter:
 *   post:
 *     summary: 筛选选项
 *     tags: [Draft]
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
router.post("/filter", (req: Request, res: Response) => new GameController('draft').optionFilter(req, res));

router.use((req, res, next) => {
  if (req.user) {
    next();
  } else {
    error(res, "请先登录", 403);
  }
})

// 获取所有故事
/**
 * @swagger
 * /api/draft/list:
 *   get:
 *     summary: 获取草稿列表
 *     tags: [Draft]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: all
 *         schema:
 *           type: string
 *         description: 获取所有草稿（仅限管理员）
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: 按名称筛选
 *       - in: query
 *         name: description
 *         schema:
 *           type: string
 *         description: 按描述筛选
 *     responses:
 *       200:
 *         description: 草稿列表
 *         content:
 *            application/json:
 *              schema:
 *                allOf:
 *                  - $ref: '#/components/schemas/ApiResponse'
 *                  - type: object
 *                    properties:
 *                      data:
 *                        type: array
 *                        items: 
 *                          $ref: '#/components/schemas/Draft'
 */
router.get("/list", async (req, res) => {
  let query: any = req.query;
  if (!req.user?.isAdmin || req.query.all != 'true') {
    query.author = req.user?.username;
  }
  if (query.name) {
    query.name = { $like: `%${query.name}%` };
  }
  if (query.description) {
    query.description = { $like: `%${query.description}%` };
  }
  query = pick(query, ['name', 'author', 'status', 'description']);
  const stories = await DraftRepo.find({
    where: query
  });
  json(res, stories);
});

// 添加新故事
/**
 * @swagger
 * /api/draft:
 *   post:
 *     summary: 创建新草稿
 *     tags: [Draft]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             $ref: '#/components/schemas/Draft'
 *     responses:
 *       200:
 *         description: 草稿已创建
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Draft'
 */
router.post("/", async (req, res) => {
  req.body.author = req.user?.username;
  const newStory = DraftRepo.create(omit(req.body, ['status', 'comment']));
  if (newStory.alias) {
    const existing = await DraftRepo.findOneBy({ alias: newStory.alias });
    if (existing) {
      return error(res, "别名已被占用，请更换别名");
    }
  }
  const result = await DraftRepo.save(newStory);
  json(res, result);
});


/**
 * @swagger
 * /api/draft/export:
 *   post:
 *     summary: 导出草稿
 *     tags: [Draft]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: string
 *             description: 草稿 ID 数组
 *     responses:
 *       200:
 *         description: 压缩的草稿数据
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
router.post('/export', async (req, res) => {
  const ids = req.body;
  if (!ids || ids.length === 0) {
    return error(res, "请选择故事！");
  }
  const storys = await DraftRepo.findBy({ id: In(ids) });
  if (!storys || storys.length === 0) {
    return error(res, "故事不存在");
  }
  const scenes = await SceneRepo.find({
    where: { storyId: In(ids) }
  }).then(scenes => scenes.map((scene) => omit(scene, ['id', 'storyId', 'createTime', 'updateTime'])));
  const items = await ItemRepo.find({
    where: { storyId: In(ids) }
  }).then(items => items.map((item) => omit(item, ['id', 'storyId', 'createTime', 'updateTime'])));

  const dataZips = [];
  for (let i = 0; i < storys.length; i++) {
    const story = storys[i];
    const scene = scenes.filter((scene) => scene.storyId === story.id);
    const item = items.filter((item) => item.storyId === story.id);
    const data = {
      ...omit(story, ['id', 'alias', 'status', 'comment', 'createTime', 'updateTime']),
      scene,
      item
    }

    const utf8Bytes = Buffer.from(JSON.stringify(data), 'utf8');
    const compressed = pako.deflate(utf8Bytes);
    const dataZip = Buffer.from(compressed).toString('base64');
    dataZips.push(dataZip);
  }

  json(res, dataZips);
});

/**
 * @swagger
 * /api/draft/import:
 *   post:
 *     summary: 导入草稿
 *     tags: [Draft]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: string
 *             description: 压缩的草稿数据字符串数组
 *     responses:
 *       200:
 *         description: 导入有效
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
 *                         $ref: '#/components/schemas/Draft'
 */
router.post('/import', async (req, res) => {
  const dataZips = req.body;
  if (!dataZips || dataZips.length === 0) {
    return error(res, "没有需导入的故事！");
  }
  const stories = [];
  for (let i = 0; i < dataZips.length; i++) {
    const dataZip = dataZips[i] as string;
    const buffer = new Uint8Array(Buffer.from(dataZip, 'base64'));
    const data = JSON.parse(Buffer.from(pako.inflate(buffer)).toString());
    if (!data.name || !data.author) {
      return error(res, "故事数据不完整");
    }
    if (data.scenes && !Array.isArray(data.scenes)) {
      return error(res, "故事场景数据不正确");
    }
    if (data.items && !Array.isArray(data.items)) {
      return error(res, "故事物品数据不正确");
    }
    if (!data.options) data.options = [];
    if (!data.effects) data.effects = [];
    const newStory = DraftRepo.create(omit(data, ['scenes', 'items', 'id', 'status', 'comment']));
    newStory.author = req.user?.username;
    newStory.status = 0; // 默认状态为草稿
    newStory.comment = '';
    newStory.alias = ''; // 重置别名
    const result = await DraftRepo.save(newStory);
    stories.push(result);

    if (data.scenes && data.scenes.length > 0) {
      const scenes = data.scenes.map((scene: any) => {
        if (!scene.attributes) scene.attributes = [];
        return SceneRepo.create({
          ...omit(scene, ['id']),
          storyId: result.id
        });
      });
      await SceneRepo.save(scenes);
    }

    if (data.items && data.items.length > 0) {
      const items = data.items.map((item: any) => {
        return ItemRepo.create({
          ...omit(item, ['id']),
          storyId: result.id
        });
      });
      await ItemRepo.save(items);
    }

    if (data.achievements && data.achievements.length > 0) {
      const achievements = data.achievements.map((target: any) => {
        return TargetRepo.create({
          ...omit(target, ['id']),
          storyId: result.id
        });
      });
      await TargetRepo.save(achievements);
    }
  }
  json(res, stories);
});


router.use('/:id', async (req, res, next) => {
  const story = await DraftRepo.findOneBy({ id: req.params.id });
  if (!story) {
    return error(res, "故事不存在");
  }
  if (story.author !== req.user?.username && !req.user?.isAdmin) {
    return error(res, "没有该故事的权限", 403);
  }
  req.story = story;

  next();
})

// 获取故事详情
/**
 * @swagger
 * /api/draft/{id}:
 *   get:
 *     summary: 获取草稿详情
 *     tags: [Draft]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 草稿 ID
 *     responses:
 *       200:
 *         description: 草稿详情
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Draft'
 */
router.get("/:id", async (req, res) => {
  json(res, req.story);
});

// 更新故事
/**
 * @swagger
 * /api/draft/{id}:
 *   put:
 *     summary: 更新草稿
 *     tags: [Draft]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 草稿 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             $ref: '#/components/schemas/Draft'
 *     responses:
 *       200:
 *         description: 草稿已更新
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Draft'
 */
router.put("/:id", async (req, res) => {
  const story = req.story!;

  if (req.body.alias) {
    const existing = await StoryRepo.findOneBy({ alias: req.body.alias, id: Not(story.id) });
    if (existing) {
      return error(res, "别名已被占用，请更换别名");
    }
  }

  DraftRepo.merge(story!, omit(req.body, ['status', 'comment']));
  story.status = 0;
  const result = await DraftRepo.save(story);
  json(res, result);
});

// 删除故事
/**
 * @swagger
 * /api/draft/{id}:
 *   delete:
 *     summary: 删除草稿
 *     tags: [Draft]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 草稿 ID
 *     responses:
 *       200:
 *         description: 草稿已删除
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
  const result = await DraftRepo.delete({ id: story.id });
  if (result.affected === 0) {
    return error(res, "故事不存在");
  }
  json(res, { message: "故事删除成功" });
});

// 推送故事
/**
 * @swagger
 * /api/draft/{id}/publish:
 *   post:
 *     summary: 发布草稿
 *     tags: [Draft]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 草稿 ID
 *     responses:
 *       200:
 *         description: 草稿已发布
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Draft'
 */
router.post("/:id/publish", async (req, res) => {
  const story = req.story!;
  story.status = 1;
  const result = await DraftRepo.save(story);

  json(res, result);
});

/**
 * @swagger
 * /api/draft/{id}/export:
 *   get:
 *     summary: 导出草稿
 *     tags: [Draft] 
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 草稿 ID
 *     responses:
 *       200:
 *         description: 压缩的草稿数据
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

// 审核故事
/**
 * @swagger
 * /api/draft/{id}/approve:
 *   post:
 *     summary: 审核草稿
 *     tags: [Draft]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 草稿 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pass:
 *                 type: boolean
 *               reason:
 *                 type: string
 *             description: 审核决定及原因
 *     responses:
 *       200:
 *         description: 草稿已审核
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
router.post("/:id/approve", async (req, res) => {
  if (!req.user?.isAdmin) {
    return error(res, "权限不足", 403);
  }
  
  const draft = req.story!;
  if (!req.body.pass) {
    draft.status = 3;
    draft.comment = req.body.reason;
    const result = await DraftRepo.save(draft);
    return json(res, result);
  }

  let story:any = await StoryRepo.findOneBy({ sourceId: draft.id });

  if (!story) {
    story = omit(draft, ['id', 'status', 'comment', 'shareUser']);
    story.status = 2;
    story.sourceId = draft.id;
    story.visible = true;

    const newStory = StoryRepo.create(story);
    story = await StoryRepo.save(newStory);
  } else {
    const updateStory = omit(story, ['id', 'status', 'comment', 'shareUser']);
    updateStory.status = 2;
    updateStory.sourceId = draft.id;
    updateStory.id = story.id;

    StoryRepo.merge(story, updateStory);
    await StoryRepo.save(story);

    await SceneRepo.delete({ storyId: story.id });
    await ItemRepo.delete({ storyId: story.id });
  }

  let scenes = await SceneRepo.find({
    where: { storyId: draft.id}
  }).then(scenes => scenes.map((scene) => omit(scene, ['id', 'storyId'])));
  scenes.forEach((scene) => {
    scene.storyId = story.id!;
  });
  story.scenes = await SceneRepo.save(SceneRepo.create(scenes));

  let items = await ItemRepo.find({
    where: { storyId: draft.id }
  }).then(items => items.map((item) => omit(item, ['id', 'storyId'])));
  items.forEach((item) => {
    item.storyId = story.id!;
  });
  story.items = await ItemRepo.save(ItemRepo.create(items));

  draft.status = 2;
  draft.comment = req.body.reason;
  DraftRepo.save(draft);

  json(res, story);
});

router.use('/:id', SceneRoute);
router.use('/:id', ItemRoute);
router.use('/:id', TargetRoute);

export default router;