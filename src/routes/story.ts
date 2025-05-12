import { Router, Request, Response } from "express";
import GameController from "../controllers/game";
import { ItemRepo, SceneRepo, Story, StoryRepo } from "../entities/";
import { error, json } from "../utils/route";
import SceneRoute from './scene';
import ItemRoute from './item';
import { omit } from "../utils";

const router = Router();
router.post("/run", (req: Request, res: Response) => new GameController('story').gameVirtual(req, res));
router.post("/filter", (req: Request, res: Response) => new GameController('story').optionFilter(req, res));

router.use((req, res, next) => {
  if (req.user?.isAdmin) {
    next();
  } else {
    error(res, "权限不足", 403);
  }
})

// 获取所有故事
router.get("/list", async (req, res) => {
  const query: any = {};
  const stories = await StoryRepo.find({
    where: query
  });
  json(res, stories);
});

// 添加新故事
router.post("/", async (req, res) => {
  req.body.author = req.user?.username;
  const newStory = StoryRepo.create(req.body);
  const result = await StoryRepo.save(newStory);
  json(res, result);
});

router.use('/:id', async (req, res, next) => {
  const story = await StoryRepo.findOneBy({ id: req.params.id });
  if (!story) {
    return next();
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
  const story = req.story! as Story;
  StoryRepo.merge(story!, req.body);
  const result = await StoryRepo.save(story);
  json(res, result);
});

// 删除故事
router.delete("/:id", async (req, res) => {
  const story = req.story!;
  const result = await StoryRepo.delete({ id: story.id });
  if (result.affected === 0) {
    return error(res, "故事不存在");
  }
  json(res, { message: "故事删除成功" });
});

router.get('/:id/export', async (req, res) => {
  const story = req.story!;
  const scenes = await SceneRepo.find({
    where: { storyId: story.id }
  }).then(scenes => scenes.map((scene) => omit(scene, ['id', 'storyId', 'createTime', 'updateTime'])));
  const items = await ItemRepo.find({
    where: { storyId: story.id }
  }).then(items => items.map((item) => omit(item, ['id', 'storyId', 'createTime', 'updateTime'])));

  json(res, {
    ...omit(story, ['id', 'status', 'comment', 'createTime', 'updateTime', 'sourceId']),
    scenes,
    items
  });
});

router.use('/:id', SceneRoute);
router.use('/:id', ItemRoute);

export default router;