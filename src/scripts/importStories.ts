import "reflect-metadata";
import { AppDataSource } from "../entities";
import { Story } from "../entities/Story";
import * as fs from "fs";
import * as path from "path";

async function importStories() {
  try {
    await AppDataSource.initialize();
    console.log("Database connected");

    AppDataSource.getRepository(Story);

    // 读取 JSON 文件
    const filePath = path.join(__dirname, "../../data/story.json");
    const storyData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    // 转换并保存数据
    await AppDataSource.transaction(async (transactionalEntityManager) => {
      const stories = Object.entries(storyData).map(([key, value]: any) => {
        const story = new Story();
        story.scene = key;
        story.content = value.text;
        story.options = value.options;
        return story;
      });

      for (const story of stories) {
        await transactionalEntityManager.save(story);
      }
    });

    console.log("Stories imported successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error importing stories:", error);
    process.exit(1);
  }
}

importStories();