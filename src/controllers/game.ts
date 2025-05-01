import { Request, Response } from 'express';
import { Record, Story, Profile, Scene, User, AppDataSource, Item } from "../entities";
import { render, json, error } from "../utils/route";
import { Effect } from '../entities/Scene';

async function gameState(userId: number, storyId: number) {
  const stateRepository = AppDataSource.getRepository(Profile);
  const state = (await stateRepository.findOneBy({ userId, storyId })) || new Profile(userId, storyId);

  if (!state.scene) {
    const storyRepository = AppDataSource.getRepository(Story);
    const story = await storyRepository.findOneBy({ id: storyId })
    if (!story) {
      throw new Error('故事不存在');
    }
    state.attr = story.attr;
    state.attrName = story.attrName;
    state.scene = story.start;
    state.inventory = story.inventory;
  }

  const scene = await getSence(state.scene, storyId);

  return { state, scene };
}

async function getSence(scene: string, storyId: number) {
  const storyRepository = AppDataSource.getRepository(Scene);

  return await storyRepository.findOneBy({ name: scene, storyId });
}

async function getItem(item: string) {
  const itemRepository = AppDataSource.getRepository(Item);
  return await itemRepository.findOneBy({ key: item });
}

async function updateOptions(story: Scene, state: Profile) {
  const recordRepository = AppDataSource.getRepository(Record);
  for (const option of story.options) {
    const record = await recordRepository.findOneBy({ user: state.userId, scene: story.name, option: option.text });
    if (option.loop !== undefined && record && (option.loop < 0 || Date.now() - record.time < option.loop)) {
      option.disabled = true;
    }
  }
  return story.options.filter((option) => !option.disabled);
}

export const init = async (user: User, req: Request, res: Response) => {
  try {
    const userId = user.id;
    const { state, scene } = await gameState(userId, parseInt(req.params.storyId));

    scene!.options = await updateOptions(scene!, state);

    render(res, 'index', req).render({
      state,
      scene,
      story: req.params.storyId,
    })

  } catch (error: any) {
    render(res, 'index', req).error(error.message).render()
  }
}

export async function runEffects(profile: Profile, effects: Effect[]) {
  try {
    let message = ''
    for (const effect of effects) {
      if (effect.type === 'Item') {
        const item = await getItem(effect.name);
        if (!item) throw new Error(`物品 ${effect.name} 未找到.`)
        const inventory = profile.inventory.find((i) => i.key === effect.name);
        const count = parseInt(effect.content || '1');
        if (inventory) {
          inventory.count += count;
        } else {
          profile.inventory.push({
            ...item,
            count,
          });
        }
  
        message += `获得 ${item.name}×${count}.\n`;
      }
      if (effect.type === 'Attr') {
        if (profile.attr[effect.name] === undefined) {
          profile.attr[effect.name] = isNaN(parseFloat(effect.content)) ? effect.content : parseFloat(effect.content);
        }
        else if (typeof profile.attr[effect.name] === 'number') {
          profile.attr[effect.name] += parseFloat(effect.content);
        }
        else {
          profile.attr[effect.name] = effect.content;
        }
      }
      if (effect.type === 'Fn') {
        return new Function('profile', 'let message = "", next = null;\n' + effect.content + '\nreturn { profile, message, next };')(profile);
      }
    }
  
    return { message };
  } catch(error) {
    throw error;
  }
}

export const game = async (user: User, req: Request, res: Response) => {
  try {
    const userId = user.id;
    const storyId = parseInt(req.params.storyId);
    let { state: profile, scene } = await gameState(userId, storyId);

    const optionText = req.body.option as string;
    const valueText = req.body.value as string;
    const timezone = req.body.timezone ?? - new Date().getTimezoneOffset() / 60;
    const option = scene?.options.find((option) => option.text === optionText);

    let message = '';
    
    if (!option) {
      throw new Error('无效选项');
    }
    
    if (option?.value && !valueText) {
      throw new Error('缺少数值');
    }

    if (option.conditions) {
      for (const condition of option.conditions) {
        if (condition.type === 'Time') {
          const time = new Date();
          if (condition.content.year !== undefined && time.getFullYear() !== condition.content.year 
        || condition.content.month !== undefined && time.getMonth() + 1 !== condition.content.month
        || condition.content.day !== undefined && time.getDate() !== condition.content.day
        || condition.content.hour !== undefined && time.getHours() !== condition.content.hour + timezone
        || condition.content.minute !== undefined && time.getMinutes() !== condition.content.minute) {
            throw new Error(`还不是时候`);
          }
        }
        if (condition.type === 'Fn') {
          const fn = new Function('state', condition.content + '\nreturn state;');
          const result = fn(profile);
          if (result !== true) {
            throw new Error(typeof result != 'string' ? `你还没准备好` : result);
          }
        }
        if (condition.type === 'Item') {
          const item = await getItem(condition.content);
          if (!item) {
            throw new Error(`物品未找到`);
          }
          const inventory = profile.inventory.find((i) => i.key === condition.name);
          let count = parseInt(condition.content || '1');
          if (option.value) {
            count = parseInt(valueText) * count
          }
          if (!inventory || inventory.count < count) {
            throw new Error(`你需要 ${item.name}×${count}.`);
          }
        }
        if (condition.type === 'ItemType') {
          const inventory = profile.inventory.find((i) => i.type === condition.content);
          if (!inventory) {
            throw new Error(`你需要 ${condition.content.toString()}.`);
          }
        }
      }
    }

    let next = option.next;
    let result = await runEffects(profile, option.effects || []);
    if (result.next) next = result.next;
    if (result.message) message += result.message;
    if (result.profile) profile = profile;

    if (next === '<back>') {
      next = profile.from;
    }

    const nextScene = await getSence(next, storyId);

    if (!nextScene) {
      throw new Error('Oops! 前方无路……');
    }

    const recordRepository = AppDataSource.getRepository(Record);
    await recordRepository.save({
      user: userId,
      storyId: storyId,
      scene: scene!.name,
      from: profile.from,
      content: scene!.content,
      option: option.text,
      time: Date.now(),
    });

    profile.from = scene!.name;
    profile.scene = nextScene.name;

    nextScene!.options = await updateOptions(nextScene!, profile);

    const stateRepository = AppDataSource.getRepository(Profile);

    const currentState = await stateRepository.findOneBy({ userId });
    if (currentState) {
      Object.assign(currentState, profile);
      await stateRepository.update(currentState.id, currentState);
    } else {
      await stateRepository.save(profile);
    }

    json(res, {
      state: profile,
      scene: nextScene,
      message,
    })
  } catch (err: any) {
    error(res, err.message)
  }
}