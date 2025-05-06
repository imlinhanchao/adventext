import { Router } from "express";
import { gameVirtual, optionFilter } from "../controllers/game";
import { AppDataSource, Scene, Story } from "../entities/";
import { error, json } from "../utils/route";
import ItemRoute from './item';

const router = Router();

router.post("/run", gameVirtual);
router.post("/filter", optionFilter);

// 获取所有故事
router.get("/list", async (req, res) => {
  const storyRepository = AppDataSource.getRepository(Story);
  const stories = await storyRepository.find();
  json(res, stories);
});

// 添加新故事
router.post("/", async (req, res) => {
  const storyRepository = AppDataSource.getRepository(Story);
  const newStory = storyRepository.create(req.body);
  const result = await storyRepository.save(newStory);
  json(res, result);
});

// 更新故事
router.put("/:id", async (req, res) => {
  const storyRepository = AppDataSource.getRepository(Story);
  const story = await storyRepository.findOneBy({ id: Number(req.params.id) });
  if (!story) {
    return error(res, "故事不存在" );
  }
  storyRepository.merge(story, req.body);
  const result = await storyRepository.save(story);
  json(res, result);
});

// 删除故事
router.delete("/:id", async (req, res) => {
  const storyRepository = AppDataSource.getRepository(Story);
  const result = await storyRepository.delete({ id: Number(req.params.id) });
  if (result.affected === 0) {
    return error(res, "故事不存在");
  }
  json(res, { message: "故事删除成功" });
});

// 获取故事详情
router.get("/:id", async (req, res) => {
  const storyRepository = AppDataSource.getRepository(Story);
  const story = await storyRepository.findOneBy({ id: Number(req.params.id) });
  if (!story) {
    return error(res, "故事不存在" );
  }
  json(res, story);
});

// 获取故事场景
router.get("/:id/scenes", async (req, res) => {
  const storyRepository = AppDataSource.getRepository(Story);
  const story = await storyRepository.findOneBy({ id: Number(req.params.id) });
  if (!story) {
    return error(res, "故事不存在" );
  }

  const sceneRepository = AppDataSource.getRepository(Scene);
  const scenes = await sceneRepository.find({
    where: { storyId: Number(req.params.id) }
  });
  json(res, scenes);
});

// 添加新场景
router.post("/:id/scene", async (req, res) => {
  const storyRepository = AppDataSource.getRepository(Story);
  const story = await storyRepository.findOneBy({ id: Number(req.params.id) });
  if (!story) {
    return error(res, "故事不存在" );
  }

  const sceneRepository = AppDataSource.getRepository(Scene);

  const existingScene = await sceneRepository.findOneBy({ name: req.body.name, storyId: Number(req.params.id) });
  if (existingScene) {
    return error(res, "场景名称已存在" );
  }
  
  const newScene = sceneRepository.create({ ...req.body, storyId: Number(req.params.id) });
  const result = await sceneRepository.save(newScene);
  json(res, result);
});

// 更新场景
router.put("/:id/scene/:sceneId", async (req, res) => {
  const storyRepository = AppDataSource.getRepository(Story);
  const story = await storyRepository.findOneBy({ id: Number(req.params.id) });
  if (!story) {
    return error(res, "故事不存在" );
  }

  const sceneRepository = AppDataSource.getRepository(Scene);
  const scene = await sceneRepository.findOneBy({ id: Number(req.params.sceneId), storyId: Number(req.params.id) });
  if (!scene) {
    return error(res, "场景不存在" );
  }

  const existingScene = await sceneRepository.findOneBy({ name: req.body.name, storyId: Number(req.params.id) });
  if (existingScene && existingScene.id !== Number(req.params.sceneId)) {
    return error(res, "场景名称已存在" );
  }
  
  sceneRepository.merge(scene, req.body);
  const result = await sceneRepository.save(scene);
  json(res, result);
});

// 删除场景
router.delete("/:id/scene/:sceneId", async (req, res) => {
  const storyRepository = AppDataSource.getRepository(Story);
  const story = await storyRepository.findOneBy({ id: Number(req.params.id) });
  if (!story) {
    return error(res, "故事不存在" );
  }

  const sceneRepository = AppDataSource.getRepository(Scene);
  const result = await sceneRepository.delete({ id: Number(req.params.sceneId), storyId: Number(req.params.id) });
  if (result.affected === 0) {
    return error(res, "场景不存在");
  }
  json(res, { message: "场景删除成功" });
});

router.post("/:id/scenes", async (req, res) => {
  try {
    const storyRepository = AppDataSource.getRepository(Story);
    const story = await storyRepository.findOneBy({ id: Number(req.params.id) });
    if (!story) {
      return error(res, "故事不存在" );
    }
  
    const sceneRepository = AppDataSource.getRepository(Scene);
    const scenes = await sceneRepository.find({
      where: { storyId: Number(req.params.id) }
    });
  
    req.body.forEach((scene: Scene) => {
      const existingScene = scenes.find(s => s.id === scene.id);
      if (existingScene) {
        sceneRepository.merge(existingScene, scene);
        scene = existingScene;
      } else {
        scene = sceneRepository.create({ ...scene, storyId: Number(req.params.id) });
      }
      sceneRepository.save(scene);
    })
  
    scenes.forEach(async (scene: Scene) => {
      if (!req.body.some((s: Scene) => s.id === scene.id)) {
        await sceneRepository.delete({ id: scene.id, storyId: Number(req.params.id) });
      }
    })
    json(res, scenes);
  } catch (err: any) {
    error(res, err.message);
  }
})

router.use(ItemRoute);

export default router;