import { Request, Response } from 'express';
import { Record, Story, Profile, Scene, User, AppDataSource, Item, End } from "../entities";
import { render, json, error } from "../utils/route";
import { Condition, Effect } from '../entities/Scene';
import { clone, omit } from '../utils';

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

async function getStory(id: number) {
  const storyRepository = AppDataSource.getRepository(Story);
  return await storyRepository.findOneBy({ id });
}

async function updateOptions(story: Scene, state: Profile) {
  const recordRepository = AppDataSource.getRepository(Record);
  for (const option of story.options) {
    const [record] = await recordRepository.find({
      where: { user: state.userId, scene: story.name, option: option.text },
      order: { time: 'DESC' }, // 按 time 字段降序排序
      take: 1, // 只取一条记录
    });
    if (!record) continue;
    if (option.loop !== undefined && record && (option.loop < 0 || Date.now() - record.time < option.loop * 1000)) {
      option.disabled = true;
    }
  }
  return story.options.filter((option) => !option.disabled);
}

export const storyList = async (user: User, req: Request, res: Response) => {
  try {
    const storyRepository = AppDataSource.getRepository(Story);
    const stories = await storyRepository.find();
    render(res, 'stories', req).render({
      stories,
    })
  } catch (error: any) {
    render(res, 'index', req).error(error.message).render()
  }
}

export const init = async (user: User, req: Request, res: Response) => {
  try {
    const userId = user.id;
    const { state, scene } = await gameState(userId, parseInt(req.params.storyId));
    const story = await getStory(parseInt(req.params.storyId));

    scene!.options = await updateOptions(scene!, state);

    render(res, 'index', req).render({
      state,
      scene,
      story: req.params.storyId,
      logo: story?.name,
    })

  } catch (error: any) {
    render(res, 'index', req).error(error.message).render()
  }
}

export async function runEffects(profile: Profile, effects: Effect[]) {
  try {
    let message = '', next = null;
    for (const effect of effects) {
      if (effect.type === 'Item') {
        const item = await getItem(effect.name);
        if (!item) throw new Error(`物品 ${effect.name} 未找到.`)
        const inventory = profile.inventory.find((i) => i.key === effect.name);
        let count = 1;
        if (typeof effect.content == 'string' && effect.content.match(/rand\(([\d-]+),([\d-]+)\)/)) {
          const rand = effect.content.match(/rand\(([\d-]+),([\d-]+)\)/);
          if (rand) {
            count = Math.floor(Math.random() * (parseInt(rand[2]) - parseInt(rand[1]) + 1)) + parseInt(rand[1]);
          }
        } else {
          count = parseFloat(effect.content || '1');
        }
        if (isNaN(count)) throw new Error(`Item ${effect.name} 效果获取数量失败！`)
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
        const oldValue = profile.attr[effect.name] || '';
        if (profile.attr[effect.name] === undefined) {
          profile.attr[effect.name] = isNaN(parseFloat(effect.content)) ? effect.content : parseFloat(effect.content);
        }
        else if (typeof profile.attr[effect.name] === 'number') {
          let count = 1;
          if (typeof effect.content == 'string' && effect.content.match(/rand\(([\d-]+),([\d-]+)\)/)) {
            const rand = effect.content.match(/rand\(([\d-]+),([\d-]+)\)/);
            if (rand) {
              count = Math.floor(Math.random() * (parseInt(rand[2]) - parseInt(rand[1]) + 1)) + parseInt(rand[1]);
            }
          } else {
            count = parseFloat(effect.content || '1');
          }
          if (isNaN(count)) throw new Error(`Item ${effect.name} 效果获取数量失败！`)
          profile.attr[effect.name] += count;
        }
        else {
          profile.attr[effect.name] = effect.content;
        }
        if (profile.attrName[effect.name]) {
          message += `${profile.attrName[effect.name]} ${oldValue} → ${effect.content}.\n`;
        }
      }
      if (effect.type === 'Fn') {
        const call = new Function('profile', 'addItem', 'setAttr', 'let message = "", next = null;\n' + effect.content + '\nreturn { message, next };');
        const items: any[] = []
        const result = call(clone(profile), (name: string, count: number) => {
          items.push({ name, count })
        }, (attr: { key: string; name?: string; value: string }) => {
          profile.attr[attr.key] = attr.value;
          if (attr.name) {
            profile.attrName[attr.key] = attr.name;
          }
        });

        for (const item of items) {
          const myItem = profile.inventory.find(i => i.name == item.name);
          if (myItem) myItem.count += item.count;
          else {
            const itemInstance = await getItem(item.name);
            if (!itemInstance) throw new Error(`物品 ${item.name} 未找到.`)
            profile.inventory.push({ ...itemInstance, count: item.count || 1 })
          }
        }

        message += result.message;
        next = result.next;
      }
    }

    return { message, next, profile };
  } catch (error) {
    throw error;
  }
}

function conditionCheckTime(condition: Condition, timezone: number) {
  const time = new Date();
  if (condition.content.year !== undefined) {
    if (Array.isArray(condition.content.year)) {
      if (time.getFullYear() < condition.content.year[0] || time.getFullYear() > condition.content.year[1]) {
        return false;
      }
    } else if (time.getFullYear() !== condition.content.year) {
      return false;
    }
  }
  if (condition.content.month !== undefined) {
    if (Array.isArray(condition.content.month)) {
      if (time.getMonth() + 1 < condition.content.month[0] || time.getMonth() + 1 > condition.content.month[1]) {
        return false;
      }
    } else if (time.getMonth() + 1 !== condition.content.month) {
      return false;
    }
  }
  if (condition.content.day !== undefined) {
    if (Array.isArray(condition.content.day)) {
      if (time.getDate() < condition.content.day[0] || time.getDate() > condition.content.day[1]) {
        return false;
      }
    } else if (time.getDate() !== condition.content.day) {
      return false;
    }
  }
  if (condition.content.hour !== undefined) {
    if (Array.isArray(condition.content.hour)) {
      if (time.getHours() + timezone < condition.content.hour[0] || time.getHours() + timezone > condition.content.hour[1]) {
        return false;
      }
    } else if (time.getHours() + timezone !== condition.content.hour) {
      return false;
    }
  }
  if (condition.content.minute !== undefined) {
    if (Array.isArray(condition.content.minute)) {
      if (time.getMinutes() < condition.content.minute[0] || time.getMinutes() > condition.content.minute[1]) {
        return false;
      }
    } else if (time.getMinutes() !== condition.content.minute) {
      return false;
    }
  }
  return true;
}

export const addEnd = async (scene: Scene, profile: Profile) => {
  if (!scene.isEnd) return;
  const endRepository = AppDataSource.getRepository(End);

  let end = await endRepository.findOneBy({ user: profile.userId, storyId: profile.storyId, end: scene.theEnd });

  if (end) return;

  end = endRepository.create({
    user: profile.userId,
    storyId: profile.storyId,
    end: scene.theEnd,
    from: scene.name,
    time: Date.now(),
  })

  return await endRepository.save(end);
}

export const gameExcute = async (profile: Profile, scene: Scene, { option: optionText, value: valueText, timezone }: any, virtual=false) => {
  try {
    const storyId = profile.storyId;
    const userId = profile.userId;
    const option = scene?.options.find((option) => option.text === optionText);

    let message = '';

    if (!option) {
      throw new Error('无效选项');
    }

    if (option?.value && !valueText) {
      throw new Error('缺少数值');
    }

    let itemTake;
    if (option?.value?.startsWith('item:')) {
      const item = await getItem(valueText.split(':')[1]);
      if (!item) {
        throw new Error(`物品 ${option.value} 未找到.`);
      }
      itemTake = item;
    }

    if (option.conditions) {
      for (const condition of option.conditions) {
        try {
          if (condition.type === 'Time') {
            if (!conditionCheckTime(condition, timezone)) {
              throw new Error(`还不是时候`);
            }
          }
          if (condition.type === 'Fn') {
            const fn = new Function('profile', 'let result = true;\n' + condition.content + '\nreturn result;');
            const result = fn(clone(profile));
            if (result !== true) {
              throw new Error(typeof result != 'string' ? `你还没准备好` : result);
            }
          }
          if (condition.type === 'Item') {
            const item = await getItem(condition.name);
            if (!item) {
              throw new Error(`物品${condition.name}未找到`);
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
            const inventory = profile.inventory.some((i) => i.type === condition.content);
            if (!inventory) {
              throw new Error(`你需要 ${condition.content.toString()}.`);
            }
          }
          if (condition.type === 'ItemAttr') {
            if (!itemTake) {
              const attrs = Object.keys(condition.content);
              const inventory = profile.inventory.some((i) => {
                return attrs.every((attr) => {
                  if (i.attributes[attr] === undefined) {
                    return false;
                  }
                  if (typeof i.attributes[attr] === 'number') {
                    return i.attributes[attr] >= condition.content[attr];
                  } else {
                    return i.attributes[attr] === condition.content[attr];
                  }
                });
              });
              if (!inventory) {
                throw new Error(`你还没准备好.`);
              }
            }
          }
          if (condition.type === 'Attr') {
            for (const [key, value] of Object.entries(condition.content)) {
              if (profile.attr[key] === undefined) {
                throw new Error(`你还没准备好.`);
              }
              if (typeof profile.attr[key] === 'number') {
                if (profile.attr[key] < parseFloat((value as any).toString())) {
                  throw new Error(`你还没准备好.`);
                }
              } else {
                if (profile.attr[key] !== value) {
                  throw new Error(`你还没准备好.`);
                }
              }
            }
          }
          if (condition.type === 'Value') {
            if (condition.content !== valueText) {
              throw new Error(`密码错误`);
            }
          }
        } catch (error) {
          if (!condition.tip) throw error;
          else {
            const tip = condition.tip.replace(/{{item}}/g, itemTake?.name || '');
            throw new Error(tip);
          }
        }
      }
    }

    let next = option.next;
    let result = await runEffects(profile, option.effects || []);
    if (result.next) next = result.next;
    if (result.message) message += result.message;
    if (result.profile) profile = result.profile;

    if (next === '<back>') {
      next = profile.from;
    }

    const nextScene = await getSence(next, storyId);

    if (!nextScene) {
      throw new Error('Oops! 前方无路……');
    }

    if (!virtual) {
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
    }

    if (nextScene.name != scene!.name) profile.from = scene!.name;
    profile.scene = nextScene.name;
    
    if (!virtual) {
      nextScene!.options = await updateOptions(nextScene!, profile);

      const stateRepository = AppDataSource.getRepository(Profile);

      const currentState = await stateRepository.findOneBy({ userId });
      if (currentState) {
        Object.assign(currentState, profile);
        await stateRepository.update(currentState.id, currentState);
      } else {
        await stateRepository.save(profile);
      }

      if (nextScene.isEnd) {
        await addEnd(nextScene, profile);
      }
    }

    return {
      state: profile,
      scene: nextScene,
      next,
      message,
    }
  } catch (err: any) {
    throw err;
  }
}

export const gameVirtual = async (req: Request, res: Response) => {
  try {
    let { profile, scene } = req.body;

    if (!scene) {
      throw new Error(`缺少运行场景！`);
    }

    if (!profile) {
      throw new Error(`缺少游戏资料！`);
    }

    const result = await gameExcute(profile, scene, req.body, true)

    json(res, result)
  } catch (err: any) {
    error(res, err.message)
  }

}

export const game = async (user: User, req: Request, res: Response) => {
  try {
    const userId = user.id;
    const storyId = parseInt(req.params.storyId);
    let { state: profile, scene } = await gameState(userId, storyId);

    if (!scene) {
      throw new Error(`场景${profile.scene}丢失！`);
    }

    const result = await gameExcute(profile, scene, req.body)

    json(res, result)
  } catch (err: any) {
    error(res, err.message)
  }
}