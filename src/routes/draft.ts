import { Router, Request, Response } from "express";
import GameController from "../controllers/game";
import { AppDataSource, Draft } from "../entities/";
import { error, json } from "../utils/route";
import SceneRoute from './scene';
import ItemRoute from './item';

const draftRepository = AppDataSource.getRepository(Draft);

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
  const query: any = {};
  if (!req.user?.isAdmin || req.query.all != 'true') {
    query.author = req.user?.username;
  }
  const stories = await draftRepository.find({
    where: query
  });
  json(res, stories);
});

// 添加新故事
router.post("/", async (req, res) => {
  req.body.author = req.user?.username;
  const newStory = draftRepository.create(req.body);
  const result = await draftRepository.save(newStory);
  json(res, result);
});

router.use('/:id', async (req, res, next) => {
  const story = await draftRepository.findOneBy({ id: req.params.id });
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
  draftRepository.merge(story!, req.body);
  const result = await draftRepository.save(story);
  json(res, result);
});

// 删除故事
router.delete("/:id", async (req, res) => {
  const story = req.story!;
  const result = await draftRepository.delete({ id: story.id });
  if (result.affected === 0) {
    return error(res, "故事不存在");
  }
  json(res, { message: "故事删除成功" });
});

router.use('/:id', SceneRoute);
router.use('/:id', ItemRoute);

export default router;