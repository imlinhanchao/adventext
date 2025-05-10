import { Router, Request, Response } from "express";
import GameController from "../controllers/game";
import { AppDataSource, Draft, Story } from "../entities/";
import { error, json } from "../utils/route";
import SceneRoute from './scene';
import ItemRoute from './item';
import { omit, pick } from "../utils";

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
  const stories = await draftRepository.find({
    where: query
  });
  json(res, stories);
});

// 添加新故事
router.post("/", async (req, res) => {
  req.body.author = req.user?.username;
  const newStory = draftRepository.create(omit(req.body, ['status', 'comment']));
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

  draftRepository.merge(story!, omit(req.body, ['status', 'comment']));
  story.status = 0;
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

// 推送故事
router.post("/:id/publish", async (req, res) => {
  const story = req.story!;
  story.status = 1;
  const result = await draftRepository.save(story);

  json(res, result);
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
    const result = await draftRepository.save(draft);
    return json(res, result);
  }

  const story = new Story();
  const storyRepository = AppDataSource.getRepository(Story);
  storyRepository.merge(story, draft);

  story.status = 2;
  story.sourceId = draft.id;

  const newStory = storyRepository.create(story);
  const result = await storyRepository.save(newStory);

  draft.status = 2;
  draft.comment = req.body.reason;
  draftRepository.save(draft);

  json(res, result);
});

router.use('/:id', SceneRoute);
router.use('/:id', ItemRoute);

export default router;