import { Request, Router } from "express";
import { DraftRepo, SceneRepo, Scene } from "../entities";
import { error, json } from "../utils/route";
import ItemRoute from './item';

export function updateStoryStatus(req: Request) {
  if (!req.baseUrl.includes('/draft/')) return;

  const story = req.story!;
  story.status = 0;
  return DraftRepo.save(story);
}

const router = Router();

router.use((req, res, next) => {
  if (req.user && req.story) {
    next();
  } else {
    error(res, "请先登录", 403);
  }
})

// 获取故事场景
router.get("/scenes", async (req, res) => {
  const story = req.story!;

  const scenes = await SceneRepo.find({
    where: { storyId: story.id }
  });
  json(res, scenes);
});

// 添加新场景
router.post("/scene", async (req, res) => {
  const story = req.story!;

  const existingScene = await SceneRepo.findOneBy({ name: req.body.name, storyId: story.id });
  if (existingScene) {
    return error(res, "场景名称已存在" );
  }
  
  const newScene = SceneRepo.create({ ...req.body, storyId: story.id });
  const result = await SceneRepo.save(newScene);

  updateStoryStatus(req);
  json(res, result);
});

// 更新场景
router.put("/scene/:sceneId", async (req, res) => {
  const story = req.story!;
  const scene = await SceneRepo.findOneBy({ id: Number(req.params.sceneId), storyId: story.id });
  if (!scene) {
    return error(res, "场景不存在" );
  }

  const existingScene = await SceneRepo.findOneBy({ name: req.body.name, storyId: story.id });
  if (existingScene && existingScene.id !== Number(req.params.sceneId)) {
    return error(res, "场景名称已存在" );
  }
  
  SceneRepo.merge(scene, req.body);
  scene.options.forEach((option) => {
    delete option.disabled
  });
  
  const result = await SceneRepo.save(scene);

  updateStoryStatus(req);
  json(res, result);
});

// 删除场景
router.delete("/scene/:sceneId", async (req, res) => {
  const story = req.story!;

  const result = await SceneRepo.delete({ id: Number(req.params.sceneId), storyId: story.id });
  if (result.affected === 0) {
    return error(res, "场景不存在");
  }

  updateStoryStatus(req);
  json(res, { message: "场景删除成功" });
});

// 批量更新场景
router.post("/scenes", async (req, res) => {
  try {
    const story = req.story!;

    const scenes = await SceneRepo.find({
      where: { storyId: story.id }
    });
  
    req.body.forEach((scene: Scene) => {
      const existingScene = scenes.find(s => s.id === scene.id);
      if (existingScene) {
        SceneRepo.merge(existingScene, scene);
        scene = existingScene;
      } else {
        scene = SceneRepo.create({ ...scene, storyId: story.id });
      }
      SceneRepo.save(scene);
    })
  
    scenes.forEach(async (scene: Scene) => {
      if (!req.body.some((s: Scene) => s.id === scene.id)) {
        await SceneRepo.delete({ id: scene.id, storyId: story.id });
      }
    })

    updateStoryStatus(req);
    json(res, scenes);
  } catch (err: any) {
    error(res, err.message);
  }
})

router.use(ItemRoute);

export default router;