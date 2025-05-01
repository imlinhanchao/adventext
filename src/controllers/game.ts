import { Request, Response } from 'express';
import { Record, Profile, Story, User, AppDataSource, Item } from "../entities";
import { render, json, error } from "../utils/route";
import { Effect } from '../entities/Story';

async function gameState(userId: number) {
  const stateRepository = AppDataSource.getRepository(Profile);
  const state = (await stateRepository.findOneBy({ userId })) || new Profile(userId);
  const scene = state.scene || 'start';
  const story = await getStory(scene);

  return { state, story };
}

async function getStory(scene: string) {
  const storyRepository = AppDataSource.getRepository(Story);

  return await storyRepository.findOneBy({ name: scene });
}

async function getItem(item: string) {
  const itemRepository = AppDataSource.getRepository(Item);
  return await itemRepository.findOneBy({ key: item });
}

async function updateOptions(story: Story, state: Profile) {
  const recordRepository = AppDataSource.getRepository(Record);
  for (const option of story.options) {
    const record = await recordRepository.findOneBy({ user: state.userId, story: story.name, option: option.text });
    if (option.loop !== undefined && record && (option.loop < 0 || Date.now() - record.time < option.loop)) {
      option.disabled = true;
    }
  }
  return story.options.filter((option) => !option.disabled);
}

export const init = async (user: User, req: Request, res: Response) => {
  try {
    const userId = user.id;
    const { state, story } = await gameState(userId);

    story!.options = await updateOptions(story!, state);

    render(res, 'index', req).render({
      state: state,
      story: story || null,
    })

  } catch (error: any) {
    render(res, 'index', req).error(error.message).render()
  }
}

export const ItemType: { [key:string]: string } = {
  'weapon': '武器',
  'armor': '护甲',
  'potion': '药水',
  'food': '食物',
  'material': '材料',
  'misc': '杂物',
}

export const game = async (user: User, req: Request, res: Response) => {
  try {
    const userId = user.id;
    let { state: profile, story } = await gameState(userId);

    const optionText = req.body.option as string;
    const valueText = req.body.value as string;
    const timezone = req.body.timezone ?? - new Date().getTimezoneOffset() / 60;
    const option = story?.options.find((option) => option.text === optionText);

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
          const inventory = profile.inventory.find((i) => i.id === condition.content);
          if (!inventory || inventory.count < 1) {
            throw new Error(`你需要 ${item.name}.`);
          }
        }
        if (condition.type === 'Gold') {
          let gold = parseInt(condition.content);
          if (option.value) {
            gold = parseInt(valueText) * gold
          }
          if (profile.gold < gold) {
            throw new Error(`你需要 ${gold} 金币.`);
          }
        }
        if (condition.type === 'ItemType') {
          const inventory = profile.inventory.find((i) => i.type === condition.content);
          if (!inventory) {
            throw new Error(`你需要 ${ItemType[condition.content.toString()]}.`);
          }
        }
      }
    }

    let next = option.next;
    if (option.effects) {
      const gold = Effect.getGold(option.effects);
      if (gold) {
        profile.gold += gold;
        message += `获得 ${gold} 金币.`;
      }
      for (const item of option.effects) {
        if (item.type === 'Gold') return;
        if (item.type === 'Item') {
          const inventory = await getItem(item.name);
          const count = parseInt(item.content);
          if (inventory) {
            message += `获得 ${inventory.name}.`;
            const item = profile.inventory.find((i) => i.id === inventory.id);
            if (item) {
              item.count += count;
            } else {
              profile.inventory.push({
                ...inventory,
                count: 1,
              });
            }
          }
        }
        if (item.type === 'Fn') {
          const result = new Function('profile', 'let message = "", next = null;\n' + item.content + '\nreturn { profile, message, next };')(profile);
          profile = result.profile;
          message += result.message;
          if (result.next) {
            next = result.next;
          }
        }
      }
    }

    if (next === '<back>') {
      next = profile.from;
    }

    const nextStory = await getStory(next);

    if (!nextStory) {
      throw new Error('Oops! 前方无路……');
    }

    const recordRepository = AppDataSource.getRepository(Record);
    await recordRepository.save({
      user: userId,
      story: story!.name,
      from: profile.from,
      content: story!.content,
      option: option.text,
      time: Date.now(),
    });

    profile.from = story!.name;
    profile.scene = nextStory.name;

    nextStory!.options = await updateOptions(nextStory!, profile);

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
      story: nextStory,
      message,
    })
  } catch (err: any) {
    error(res, err.message)
  }
}