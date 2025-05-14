import { Request, Response } from 'express';
import { Record, Story, Profile, Scene, User, Item, End, Draft, StoryRepo, DraftRepo, ProfileRepo, EndRepo, SceneRepo, ItemRepo, RecordRepo, UserRepo, RankRepo } from "../entities";
import { render, json, error } from "../utils/route";
import { Condition, Effect } from '../entities/Scene';
import { clone, shortTime } from '../utils';
import { Inventory } from '../entities/Profile';
import { isNumber } from '../utils/is';
import { In, Not } from 'typeorm';
import { nextTick } from 'process';
import { profile } from 'console';

function fillVar (content: string, type: string, target: any) {
  const mat = content.match(new RegExp(`${type}(\S+)${type}`, 'g'));
  if (mat) {
    for (const m of mat) {
      const key = m.replaceAll(type, '');
      if (target && target[key] !== undefined) {
        content = content.replace(m, target[key]);
      }
    }
  }
  return content;
}

function formatContent (content: string, profileAttr: any, value: string, itemTakeAttr?: any) {
  if (isNumber(content)) return content;
  content = fillVar(content, '\\$', itemTakeAttr);
  content = fillVar(content, '#', profileAttr);
  content = content.replace(/\s/g, '')
  while (content.includes('rand') || content.includes('percent')) {
    let mat = content.match(/rand\(([\d-]+),([\d-]+)\)/);
    if (mat) {
      content = content.replace(/rand\(([\d-]+),([\d-]+)\)/, Math.floor(Math.random() * (parseInt(mat[2]) - parseInt(mat[1]) + 1)) + parseInt(mat[1]) + '');
    }
    mat = content.match(/percent\(([\d.]+),*(\d+)*\)/);
    if (mat) {
      content = content.replace(/percent\(([\d.]+),*(\d+)*\)/, (Math.floor(Math.random() * 100) < parseFloat(mat[1]) ? parseInt(mat[2] || '1') : 0) + '');
    }
  }
  return isNaN(parseFloat(content)) ? content : parseFloat(content);
}

function operatorData (left: string | number, right: string | number, operator: string) {
  if (typeof right === 'string' || typeof left === 'string') {
    switch (operator) {
      case '=':
        return right;
      case '+':
        return left + '' + right;
      default:
        throw new Error(`数据不支持 ${operator} 操作`);
    }
  } else {
    switch (operator) {
      case '=':
        return right;
      case '+':
        return left + right;
      case '-':
        return left - right;
      case '*':
        return left * right;
      case '/':
        return left / right;
      default:
        throw new Error(`无效操作符 ${operator}`);
    }
  }

}

function conditionCheckTime (condition: Condition, timezone: number) {
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


export default class GameController {
  private type: string;

  constructor(type: string) {
    this.type = type;
  }

  get storyRepo () {
    return this.type == 'draft' ? DraftRepo : StoryRepo;
  }

  async gameState (userId: number, storyId: string) {
    const state = (await ProfileRepo.findOneBy({ userId, storyId, isEnd: false })) || new Profile(userId, storyId);

    if (!state.scene) {
      const story = await this.storyRepo.findOneBy({ id: storyId });
      if (!story) {
        throw new Error('故事不存在');
      }
      state.attr = story.attr;
      state.attrName = story.attrName;
      state.scene = story.start;
      state.inventory = story.inventory;
    }

    const scene = await this.getSence(state.scene, storyId);

    return { state, scene };
  }

  async getSence (scene: string, storyId: string) {
    return await SceneRepo.findOneBy({ name: scene, storyId });
  }

  async getItem (item: string) {
    return await ItemRepo.findOneBy({ key: item });
  }

  async getStory (id: string) {
    return await this.storyRepo.findOneBy({ id });
  }

  async updateOptions (story: Scene, state: Profile, timezone: number, records?: Record[]) {
    for (const option of story.options) {
      let record;
      if (!records) {
        const [r] = await RecordRepo.find({
          where: { user: state.userId, scene: story.name, option: option.text, endId: state.endId },
          order: { time: 'DESC' },
          take: 1,
        });
        record = r;
      } else {
        record = records.find((r) => r.scene == story.name && r.option == option.text);
      }
      option.disabled = option.loop !== undefined && record && (option.loop < 0 || Date.now() - record.time < option.loop * 1000);
      if (option.disabled) continue;
      option.disabled = !(await this.checkConditions(option.conditions?.filter(c => c.isHide) || [], state, option, '', timezone).catch(() => false));
    }

    return story.options;
  }

  async checkConditions (conditions: Condition[], profile: Profile, option: any, valueText: string, timezone: number, itemTake?: Inventory) {
    for (const condition of conditions) {
      try {
        if (condition.type === 'Time') {
          if (!conditionCheckTime(condition, timezone)) {
            throw new Error(`还不是时候`);
          }
        }
        if (condition.type === 'Fn') {
          const fn = new Function('profile', 'value', 'itemSelect', 'let result = true;\n' + condition.content + '\nreturn result;');
          const result = fn(clone(profile), valueText, itemTake?.name);
          if (result !== true) {
            throw new Error(typeof result != 'string' ? `你还没准备好` : result);
          }
        }
        if (condition.type === 'Item') {
          const item = await this.getItem(condition.name);
          if (!item) {
            throw new Error(`物品${condition.name}未找到`);
          }
          const inventory = profile.inventory.find((i) => i.key === condition.name);
          let count = parseInt(condition.content || '1');
          if (option.value && !option.value?.startsWith('item:')) {
            count = parseInt(valueText) * count
          }
          if (!inventory || inventory.count < count) {
            throw new Error(`你需要 ${item.name}×${count}.`);
          }
        }
        if (condition.type === 'ItemType') {
          const inventory = profile.inventory.some((i) => i.type === condition.content && i.count > 0);
          if (!inventory) {
            throw new Error(`你需要 ${condition.content.toString()}.`);
          }
        }
        if (condition.type === 'ItemAttr') {
          if (!itemTake) {
            const attrs = Object.keys(condition.content);
            const inventory = profile.inventory.some((i) => {
              return attrs.every((attr) => {
                if (condition.content[attr] === '') return !!i.attributes[attr];
                if (i.attributes[attr] === undefined) {
                  return false;
                }
                if (typeof i.attributes[attr] === 'number') {
                  return i.attributes[attr] * i.count >= condition.content[attr];
                } else {
                  return i.attributes[attr] === condition.content[attr];
                }
              });
            });
            if (!inventory) {
              throw new Error(`你还没准备好.`);
            }
          } else {
            const attrs = Object.keys(condition.content);
            const inventory = attrs.every((attr) => {
              if (condition.content[attr] === '') return !!itemTake.attributes[attr];
              if (itemTake.attributes[attr] === undefined) {
                return false;
              }
              if (typeof itemTake.attributes[attr] === 'number') {
                return itemTake.attributes[attr] * itemTake.count >= condition.content[attr];
              } else {
                return itemTake.attributes[attr] === condition.content[attr];
              }
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
          let tip = condition.tip.replace(/\$item/g, itemTake?.name || '').replace(/\$value/g, valueText || '');
          tip = fillVar(tip, '\\$', itemTake?.attributes);
          tip = fillVar(tip, '#', profile.attr);
          throw new Error(tip);
        }
      }
    }
    return true;
  }


  async runEffects (profile: Profile, effects: Effect[], value: string, itemTake?: Inventory) {
    try {
      let message = '', next = null;
      for (const effect of effects) {
        effect.operator = effect.operator || '=';
        effect.content = effect.content.replace(/\$value/g, value);
        effect.content = effect.content.replaceAll('\\n', '\n');
        if (effect.type === 'Item') {
          let item;
          if (effect.name !== '$item') item = await this.getItem(effect.name);
          else item = itemTake;
          if (!item) throw new Error(`物品 ${effect.name} 未找到.`)
          const inventory = profile.inventory.find((i) => i.key === effect.name);
          let count = formatContent(effect.content || '1', profile.attr, value, itemTake?.attributes);
          if (!isNumber(count)) throw new Error(`Item ${effect.name} 效果获取数量失败！`)
          if (inventory) {
            inventory.count += count;
          } else if (count) {
            profile.inventory.push({
              ...item,
              count,
            });
          }
          profile.inventory = profile.inventory.filter(i => i.count > 0);

          if (count) message += `${count > 0 ? '获得' : '扣除'} ${item.name}×${Math.abs(count)}.\n`;
        }
        if (effect.type === 'Attr') {
          const oldValue = profile.attr[effect.name] || '';
          if (profile.attr[effect.name] === undefined) {
            const content = formatContent(effect.content || '1', profile.attr, value, itemTake?.attributes);
            profile.attr[effect.name] = content;
          }
          else if (typeof profile.attr[effect.name] === 'number') {
            let count = formatContent(effect.content || '1', profile.attr, value, itemTake?.attributes);
            if (!isNumber(count)) throw new Error(`Attr ${effect.name} 效果获取数量失败！`)
            profile.attr[effect.name] = operatorData(profile.attr[effect.name], count, effect.operator);
          }
          else {
            let content = fillVar(effect.content, '\\$', itemTake?.attributes);
            content = fillVar(content, '#', profile.attr);
            profile.attr[effect.name] = operatorData(profile.attr[effect.name], content, effect.operator);
          }
          if (profile.attrName[effect.name]) {
            message += `${profile.attrName[effect.name]} ${oldValue} → ${effect.content}.\n`;
          }
        }
        if (effect.type === 'ItemAttr') {
          if (!itemTake) {
            const attr = effect.name;
            const inventorys = profile.inventory.filter((i) => {
              return i.attributes[attr] !== undefined;
            });
            if (!inventorys.length) {
              throw new Error(`你没有包含${attr}的物品.`);
            }
            let count = formatContent(effect.content || '1', profile.attr, value);
            if (!isNumber(count)) throw new Error(`ItemAttr ${effect.name} 效果获取数量失败！`)
            let total = 0;
            for (const inventory of inventorys) {
              if (total >= count) break;
              if (inventory.attributes[attr] * inventory.count + total > count) {
                const itemCount = Math.ceil((count - total) / inventory.attributes[attr]);
                total += itemCount * inventory.attributes[attr];
                message += `扣除 ${inventory.name}×${itemCount}.\n`;
                inventory.count -= itemCount;
              } else {
                total += inventory.attributes[attr] * inventory.count;
                message += `扣除 ${inventory.name}×${inventory.count}.\n`;
                profile.inventory = profile.inventory.filter(i => i.key != inventory.key);
              }
            }
          } else {
            if (itemTake.attributes[effect.name] === undefined) {
              throw new Error(`物品 ${itemTake.name} 不包含属性 ${effect.name}.`);
            }
            let count = formatContent(effect.content || '1', profile.attr, value, itemTake.attributes);
            if (!isNumber(count)) throw new Error(`ItemAttr ${effect.name} 效果获取数量失败！`)
            const itemCount = Math.ceil(count / itemTake.attributes[effect.name]);
            if (itemCount > itemTake.count) {
              throw new Error(`物品 ${itemTake.name} 数量不足.`);
            }
            if (itemCount > 0) {
              message += `扣除 ${itemTake.name}×${itemCount}.\n`;
              itemTake.count -= itemCount;
              if (itemTake.count <= 0) {
                profile.inventory = profile.inventory.filter(i => i.key != itemTake.key);
              }
            }
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
            const myItem = profile.inventory.find(i => i.key == item.name);
            if (myItem) myItem.count += item.count;
            else {
              const itemInstance = await this.getItem(item.name);
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

  async addEnd (scene: Scene, profile: Profile) {
    if (!scene.isEnd) return;

    let end = await EndRepo.findOneBy({ user: profile.userId, storyId: profile.storyId, end: scene.theEnd });

    if (end) return;

    end = EndRepo.create({
      user: profile.userId,
      storyId: profile.storyId,
      end: scene.theEnd,
      from: scene.name,
      endId: profile.endId,
      time: Date.now(),
      cost: Date.now() - profile.createTime,
    })

    return await EndRepo.save(end);
  }

  async restartGame (user: User, req: Request, res: Response) {
    try {
      const userId = user.id;
      const storyId = req.params.storyId;
      let { state, scene } = await this.gameState(userId, storyId);

      if (!scene?.isEnd) {
        throw new Error('还没有结局');
      }

      state.isEnd = true;
      await ProfileRepo.save(state);

      json(res, { message: '游戏已重置' })
    } catch (error: any) {
      error(res, error.message)
    }
  }

  async resetGame (user: User, req: Request, res: Response, next: () => void) {
    try {
      const userId = user.id;
      const storyId = req.params.storyId;
      let { state } = await this.gameState(userId, storyId);

      if (this.type != 'draft') return next();

      const endId = state.endId;
      await ProfileRepo.delete({ userId, storyId, endId });
      await RecordRepo.delete({ user: userId, storyId, endId });

      json(res, { message: '游戏已重置' })
    } catch (error: any) {
      error(res, error.message)
    }
  }

  async record (user: User, req: Request, res: Response, next: () => void) {
    try {
      const storyId = req.params.storyId;
      const story = await this.storyRepo.findOneBy({ id: storyId });
      let { p, count, end } = req.query;
      const page = Number(p || 1);
      const size = Math.min(Number(count || 50), 100);
      
      if (!story) return next()
      
      const profile = await ProfileRepo.findOneBy({
        isEnd: false,
        storyId,
        userId: user.id,
      });

      if (!profile) {
        render(res, 'record', req).title('游戏记录').logo(story.name).render({
          list: [],
          total: 0,
          page,
          size,
          story,
          endId: end,
          ends: [],
          profile: {},
        })
        return;
      }

      const ends = await EndRepo.find({
        where: {
          storyId,
          user: user.id,
        }
      });

      if (!end || !ends.some(p => p.endId == Number(end))) {
        end = profile.endId + '';
      }

      if (!end) next();

      const list = await RecordRepo.find({
        where: { storyId, endId: Number(end), user: user.id },
        order: { time: 'DESC' },
        take: size,
        skip: (page - 1) * size,
      });

      const total = await RecordRepo.createQueryBuilder('record')
        .select('COUNT(DISTINCT record.id)', 'total')
        .where('record.storyId = :storyId', { storyId })
        .andWhere('record.endId = :endId', { endId: end })
        .andWhere('record.user = :userId', { userId: user.id })
        .getRawOne().then((data) => data.total);

      render(res, 'record', req).title('游戏记录').logo(story.name).render({
        list,
        total,
        page,
        size,
        story,
        endId: end,
        ends,
        profile,
      })
    } catch (err: any) {
      error(res, err.message)
    }
  }

  async rank (user: User, req: Request, res: Response, next: () => void) {
    try {
      const storyId = req.params.storyId;
      const story = await this.storyRepo.findOneBy({ id: storyId });
      let { p, count } = req.query;
      const page = Number(p || 1);
      const size = Math.min(Number(count || 50), 100);
      
      if (!story) return next()
        
      const list = await RankRepo.find({
        where: { storyId, username: Not(story.author) },
        order: { endCount: 'DESC', totalCost: 'ASC' },
        take: size,
        skip: (page - 1) * size,
      })

      const total = await EndRepo.createQueryBuilder('end')
        .select('COUNT(DISTINCT end.user)', 'total')
        .where('end.storyId = :storyId', { storyId })
        .getRawOne().then((data) => data.total);

      const totalPlayer = await ProfileRepo.createQueryBuilder('profile')
        .select('COUNT(DISTINCT profile.userId)', 'total')
        .where('profile.storyId = :storyId', { storyId })
        .getRawOne().then((data) => data.total);

      render(res, 'rank', req).title('排行榜').logo(story.name).render({
        list,
        total: total.total,
        page,
        size,
        story,
        user: user.id,
        totalPlayer,
        shortTime,
      })
    } catch (err: any) {
      error(res, err.message)
    }
  }

  getContent(profile: Profile, scene: Scene) {
    let content = scene.content;

    content = fillVar(content, '#', profile.attr);

    Object.entries(profile.attr).forEach(([key, value]) => {
      if (scene.content.includes(`\${${key}}`)) {
        scene.content = scene.content.replaceAll(`\${${key}}`, value + '');
      }
    });
    scene.options.forEach(option => {
      if (option.append && !option.disabled) {
        if (content.includes('${' + option.text + '}')) {
          content = content.replaceAll('${' + option.text + '}', option.append);
        } else {
          content += option.append;
        }
      }
      if (option.antiAppend && option.disabled) {
        if (content.includes('${' + option.text + '}')) {
          content = content.replaceAll('${' + option.text + '}', option.antiAppend);
        } else {
          content += option.antiAppend;
        }
      }
      if (option.append || option.antiAppend) {
        content = content.replaceAll('${' + option.text + '}', '');
      }
    })
    return content;
  }

  async gameExcute (profile: Profile, scene: Scene, { option: optionText, value: valueText, timezone }: any, virtual = false) {
    try {
      const storyId = profile.storyId;
      const userId = profile.userId;
      const option = scene?.options.find((option) => option.text === optionText);
      timezone = timezone ?? new Date().getTimezoneOffset() / -60;

      let message = '';

      if (!option) {
        throw new Error('无效选项');
      }

      if (option?.value && !valueText) {
        throw new Error('缺少数值');
      }

      let itemTake;
      if (option?.value?.startsWith('item:')) {
        const item = profile.inventory.find((i) => i.key === valueText.split(':')[1]);
        if (!item) {
          throw new Error(`物品 ${option.value} 未找到.`);
        }
        itemTake = item;
      }

      if (option.conditions) {
        await this.checkConditions(option.conditions, profile, option, valueText, timezone, itemTake);
      }

      let next = option.next;
      let result = await this.runEffects(profile, option.effects || [], valueText, itemTake);
      if (result.next) next = result.next;
      if (result.message) message += result.message;
      if (result.profile) profile = result.profile;

      if (next === '<back>') {
        next = profile.from;
      }

      const nextScene = await this.getSence(next, storyId);

      if (!nextScene) {
        throw new Error('Oops! 前方无路……');
      }

      if (!virtual) {
        await RecordRepo.save({
          user: userId,
          storyId: storyId,
          scene: scene!.name,
          endId: profile.endId,
          from: profile.from,
          content: this.getContent(profile, scene),
          option: option.text,
          time: Date.now(),
        });
      }

      if (nextScene.name != scene!.name) profile.from = scene!.name;
      profile.scene = nextScene.name;

      if (!virtual) {
        nextScene!.options = await this.updateOptions(nextScene!, profile, timezone);

        if (nextScene.isEnd) {
          await this.addEnd(nextScene, profile);
        }

        const currentState = await ProfileRepo.findOneBy({ userId, storyId, isEnd: false });
        if (currentState) {
          Object.assign(currentState, profile);
          await ProfileRepo.save(currentState);
        } else {
          await ProfileRepo.save(profile);
        }
      }

      return {
        state: profile,
        scene: nextScene,
        next,
        message,
        content: this.getContent(profile, nextScene),
      }
    } catch (err: any) {
      throw err;
    }
  }

  async optionFilter (req: Request, res: Response) {
    try {
      const { scene, profile, timezone, records } = req.body;
      if (!scene) {
        throw new Error(`缺少运行场景！`);
      }
      if (!profile) {
        throw new Error(`缺少游戏资料！`);
      }
      scene.options = await this.updateOptions(scene, profile, timezone ?? new Date().getTimezoneOffset() / -60, records || []);
      const content = this.getContent(profile, scene);
      json(res, {
        options: scene.options,
        content,
      })
    } catch (err: any) {
      error(res, err.message)
    }
  }

  async gameVirtual (req: Request, res: Response) {
    try {
      let { profile, scene } = req.body;

      if (!scene) {
        throw new Error(`缺少运行场景！`);
      }

      if (!profile) {
        throw new Error(`缺少游戏资料！`);
      }

      const result = await this.gameExcute(profile, scene, req.body, true)

      json(res, result)
    } catch (err: any) {
      error(res, err.message)
    }
  }

  async game (user: User, req: Request, res: Response) {
    try {
      const userId = user.id;
      const storyId = req.params.storyId;
      let { state: profile, scene } = await this.gameState(userId, storyId);

      if (!scene) {
        throw new Error(`场景${profile.scene}丢失！`);
      }

      const result = await this.gameExcute(profile, scene, req.body)
      scene = result.scene;
      scene.options = scene.options.filter(o => !o.disabled);

      json(res, {
        ...result,
        scene
      })
    } catch (err: any) {
      error(res, err.message)
    }
  }

  async storyList (req: Request, res: Response) {
    try {
      const stories = await this.storyRepo.find({
        where: { status: 2 },
        order: { createTime: 'DESC' },
      });
      const storyIds = stories.map((s) => s.id);
      const endScenes = await SceneRepo.createQueryBuilder("scene")
        .select("scene.storyId", "storyId")
        .addSelect("COUNT(*)", "count")
        .where("scene.storyId IN (:...storyIds)", { storyIds })
        .andWhere("scene.isEnd = :isEnd", { isEnd: true })
        .groupBy("scene.storyId")
        .getRawMany();
      const finish = await EndRepo.createQueryBuilder("end")
        .select("end.storyId", "storyId")
        .addSelect("COUNT(*)", "count")
        .where("end.storyId IN (:...storyIds)", { storyIds })
        .andWhere("end.user = :userId", { userId: req.session.user.id })
        .groupBy("end.storyId")
        .getRawMany();
      render(res, 'stories', req).render({
        stories: stories.map((story) => {
          const end = endScenes.find((e) => e.storyId == story.id);
          const findEndItem = finish.find((e) => e.storyId == story.id);
          return {
            ...story,
            end: end ? parseInt(end.count) : 0,
            finish: findEndItem ? parseInt(findEndItem.count) : 0,
          }
        }),
      })
    } catch (error: any) {
      render(res, 'index', req).error(error.message).render()
    }
  }

  async init (user: User, req: Request, res: Response) {
    try {
      const userId = user.id;
      const story = await this.getStory(req.params.storyId);

      if (!story) {
        return {};
      }

      const { state, scene } = await this.gameState(userId, req.params.storyId);

      scene!.options = await this.updateOptions(scene!, state, req.body?.timezone ?? new Date().getTimezoneOffset() / -60);

      return {
        state,
        scene,
        story,
        content: this.getContent(state, scene!)
      }

    } catch (error: any) {
      throw error;
    }
  }
}

