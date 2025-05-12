import "reflect-metadata";
import { AppDataSource, ItemRepo, SceneRepo, StoryRepo } from "../entities";
import { Scene } from "../entities/Scene";
import * as fs from "fs";
import * as path from "path";
import { omit } from "../utils";

async function importStories () {
  try {
    await AppDataSource.initialize();
    console.log("Database connected");

    // 读取 JSON 文件
    const filePath = path.join(__dirname, "../../data/story.json");
    const stories = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    for (const storyData of stories) {
      const story = await StoryRepo.save(StoryRepo.create(omit(storyData, ['scenes', 'items'])));
      await SceneRepo.save(SceneRepo.create(storyData.scenes.map((scene: Scene) => {
        scene.storyId = story.id;
      })));
      await ItemRepo.save(ItemRepo.create(storyData.items.map((item: Scene) => {
        item.storyId = story.id;
      })));

      console.log(`Story ${story.name} imported successfully`);
    }

    console.log("Stories imported successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error importing stories:", error);
    process.exit(1);
  }
}

importStories();