import pako from "pako";
import { Router, Request, Response } from "express";
import GameController from "../controllers/game";
import { StoryRepo, DraftRepo, SceneRepo, ItemRepo } from "../entities/";
import { error, json } from "../utils/route";
import SceneRoute from './scene';
import ItemRoute from './item';
import { omit, pick } from "../utils";
import { In } from "typeorm";

const router = Router();
router.post("/run", (req: Request, res: Response) => new GameController('draft').gameVirtual(req, res));
router.post("/filter", (req: Request, res: Response) => new GameController('draft').optionFilter(req, res));

router.use((req, res, next) => {
  if (req.user) {
    next();
  } else {
    error(res, "请先登录", 403);
  }
})

// 获取所有故事
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
router.post("/", async (req, res) => {
  req.body.author = req.user?.username;
  const newStory = DraftRepo.create(omit(req.body, ['status', 'comment']));
  const result = await DraftRepo.save(newStory);
  json(res, result);
});


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
      ...omit(story, ['id', 'status', 'comment', 'createTime', 'updateTime']),
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
router.get("/:id", async (req, res) => {
  json(res, req.story);
});

// 更新故事
router.put("/:id", async (req, res) => {
  const story = req.story!;

  DraftRepo.merge(story!, omit(req.body, ['status', 'comment']));
  story.status = 0;
  const result = await DraftRepo.save(story);
  json(res, result);
});

// 删除故事
router.delete("/:id", async (req, res) => {
  const story = req.story!;
  const result = await DraftRepo.delete({ id: story.id });
  if (result.affected === 0) {
    return error(res, "故事不存在");
  }
  json(res, { message: "故事删除成功" });
});

// 推送故事
router.post("/:id/publish", async (req, res) => {
  const story = req.story!;
  story.status = 1;
  const result = await DraftRepo.save(story);

  json(res, result);
});

router.get('/:id/export', async (req, res) => {
  const story = req.story!;
  const scenes = await SceneRepo.find({
    where: { storyId: story.id }
  }).then(scenes => scenes.map((scene) => omit(scene, ['id', 'storyId', 'createTime', 'updateTime'])));
  const items = await ItemRepo.find({
    where: { storyId: story.id }
  }).then(items => items.map((item) => omit(item, ['id', 'storyId', 'createTime', 'updateTime'])));

  const data = {
    ...omit(story, ['id', 'status', 'comment', 'createTime', 'updateTime']),
    scenes,
    items
  }

  const utf8Bytes = Buffer.from(JSON.stringify(data), 'utf8');
  const compressed = pako.deflate(utf8Bytes);
  const dataZip = Buffer.from(compressed).toString('base64');

  json(res, dataZip);
});

// 审核故事
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
    story = omit(draft, ['id', 'status', 'comment']);
    story.status = 2;
    story.sourceId = draft.id;

    const newStory = StoryRepo.create(story);
    story = await StoryRepo.save(newStory);
  } else {
    const updateStory = omit(story, ['id', 'status', 'comment']);
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

export default router;