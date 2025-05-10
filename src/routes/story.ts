import { Router, Request, Response } from "express";
import GameController from "../controllers/game";
import { AppDataSource, Story } from "../entities/";
import { error, json } from "../utils/route";
import SceneRoute from './scene';
import ItemRoute from './item';

const storyRepository = AppDataSource.getRepository(Story);

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
  const stories = await storyRepository.find({
    where: query
  });
  json(res, stories);
});

// 添加新故事
router.post("/", async (req, res) => {
  req.body.author = req.user?.username;
  const newStory = storyRepository.create(req.body);
  const result = await storyRepository.save(newStory);
  json(res, result);
});

router.use('/:id', async (req, res, next) => {
  const story = await storyRepository.findOneBy({ id: req.params.id });
  if (!story) {
    return error(res, "故事不存在" );
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
  storyRepository.merge(story!, req.body);
  const result = await storyRepository.save(story);
  json(res, result);
});

// 删除故事
router.delete("/:id", async (req, res) => {
  const story = req.story!;
  const result = await storyRepository.delete({ id: story.id });
  if (result.affected === 0) {
    return error(res, "故事不存在");
  }
  json(res, { message: "故事删除成功" });
});

router.use('/:id', SceneRoute);
router.use('/:id', ItemRoute);

export default router;