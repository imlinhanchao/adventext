import { Request, Response } from 'express';
import { Record, State, Story, User, AppDataSource } from "../entities";
import { render } from "../utils/route";

async function gameState(userId: number) {
  const stateRepository = AppDataSource.getRepository(State);    
  const state = (await stateRepository.findOneBy({ userId })) || new State(userId);
  const scene = state.currentScene || "start";
  const story = await getStory(scene);

  return { state, story };
}

async function getStory(scene: string) {
  const storyRepository = AppDataSource.getRepository(Story);    
  return await storyRepository.findOneBy({ scene });
}

async function updateOptions(story: Story, state: State) {
  const recordRepository = AppDataSource.getRepository(Record);
  for (const option of story.options) {
    if (option.once) {
      const record = await recordRepository.findOneBy({ user: state.userId, story: story.id, option: option.text });
      if (record) {
        option.disabled = true;
      }
    }
  }
  return story.options.filter((option) => !option.disabled);
}

export const init = async (user: User, req: Request, res: Response) => {
  try {
    const userId = user.id;
    const { state, story } = await gameState(userId );

    story!.options = await updateOptions(story!, state);

    render(res, 'index', req).render({
      state: state,
      story: story || null,
    })
    
  } catch (error: any) {
    render(res, 'index', req).error(error.message).render()
  }
}

export const game = async (user: User, req: Request, res: Response) => {
  try {
    const userId = user.id;
    let { state, story } = await gameState(userId);
    try {
      const optionText = req.body.option as string;
      const option = story?.options.find((option) => option.text === optionText);

      if (!option) {
        throw new Error('Invalid option selected');
      }

      if (option.condition) {
        const { item, gold } = option.condition;
        if (item && !state.inventory[item]) {
          throw new Error(`You need ${item} to proceed.`);
        }
        if (gold && state.gold < gold) {
          throw new Error(`You need ${gold} gold to proceed.`);
        }
      }

      const recordRepository = AppDataSource.getRepository(Record);
      recordRepository.save({
        user: userId,
        story: story!.id,
        content: story!.content,
        option: option.text,
        time: Date.now(),
      });

      story = await getStory(option.next);

      if (!story) {
        throw new Error('Story not found');
      }

      state.currentScene = story.scene;

      if (option.effect) {
        const { items } = option.effect;
        const gold = option.effect.gold
        items.forEach((item) => {
          if (item.name !== 'Gold') {
            state.inventory[item.name] = (state.inventory[item.name] || 0) + item.count;
          }
        });
        if (gold) state.gold += gold;
      }

      story!.options = await updateOptions(story!, state);

      const stateRepository = AppDataSource.getRepository(State);    

      const currentState = await stateRepository.findOneBy({ userId });
      if (currentState) {
        Object.assign(currentState, state);
        await stateRepository.update(currentState.id, currentState);
      } else {
        await stateRepository.save({
          userId,
          inventory: state.inventory,
          gold: state.gold,
          currentScene: story?.scene,
        });
      }

      render(res, 'index', req).render({
        state,
        story,
      })
    } catch (error: any) {
      render(res, 'index', req).error(error.message).render({
        state,
        story,
      })
  }} catch (error: any) {
    render(res, 'index', req).error(error.message).render()
  }
}