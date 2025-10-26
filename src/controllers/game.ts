import { Request, Response } from 'express';
import { Record, Profile, Scene, User, StoryRepo, DraftRepo, ProfileRepo, EndRepo, SceneRepo, ItemRepo, RecordRepo, RankRepo, Item, TargetRepo, AchievementRepo, Achievement, Target, Draft, Story } from "../entities";
import { render, json, error } from "../utils/route";
import { Condition, Effect, Option } from '../entities/Scene';
import { clone, omit, shortTime } from '../utils';
import { Inventory } from '../entities/Profile';
import { isArray, isNumber, isString } from '../utils/is';
import { Not } from 'typeorm';
import { callFn, createFn, tryEval } from '../utils/call';

function fillVar(content: string, type: string, target: any) {
  const mat = content.match(new RegExp(`${type}(\\S+)${type}`, 'g'));
  if (mat) {
    for (const m of mat) {
      const key = m.replaceAll(type.replaceAll('\\', ''), '');
      if (target && target[key] !== undefined) {
        content = content.replace(m, target[key]);
      }
    }
  }
  return content;
}

function formatContent(content: string, profileAttr: any, value: string, itemTakeAttr?: any) {
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
  if (isNaN(parseFloat(content)) && value && isNaN(parseFloat(value))) {
    return parseFloat(content) * parseFloat(value);
  }
  return !content.trim().match(/^[\d.]+$/) ? tryEval(content) : parseFloat(content);
}

function operatorData(left: string | number, right: string | number, operator: string) {
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
      if (time.getUTCHours() + timezone < condition.content.hour[0] || time.getUTCHours() + timezone > condition.content.hour[1]) {
        return false;
      }
    } else if (time.getUTCHours() + timezone !== condition.content.hour) {
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
  private achievements?: Achievement[];
  private circle?: number;
  private story: Draft | Story | null = null;

  private callLogs: { type: string, data: any }[] = [];

  constructor(type: string, story?: Draft | Story) {
    this.type = type;
    this.story = story || null;
  }

  get storyRepo() {
    return this.type == 'draft' ? DraftRepo : StoryRepo;
  }

  setStory(story?: Draft | Story) {
    this.story = story || null;
  }

  async gameState(userId: number, storyId: string) {
    let state = (await ProfileRepo.findOneBy({ userId, storyId, isEnd: false })) || new Profile(userId, storyId);

    let isBegin = false;
    const story = this.story;
    if (!story) {
      throw new Error('故事不存在');
    }
    if (!state.scene) {
      state.attr = isArray(story.attr) ? story.attr.reduce((acc: any, cur: any) => (acc[cur.key] = cur.value, acc ), {}) : story.attr;
      state.attrName = story.attrName;
      state.scene = story.start;
      state.inventory = story.inventory;
      isBegin = true;
    }

    let scene = await this.getSence(state.scene, storyId);
    if (!scene) {
      if (!story) {
        throw new Error('故事不存在');
      }
      scene = await this.getSence(story.start, storyId);
    }

    if (isBegin && scene?.attributes?.length) {
      state.sceneAttr = scene.attributes.reduce((acc: any, cur: any) => { acc[cur.key] = cur.value, acc }, {});
    }

    return { state, scene, global: { options: story?.options } };
  }

  async getSence(scene: string, storyId: string) {
    return await SceneRepo.findOneBy({ name: scene, storyId });
  }

  async getItem(key: string, storyId: string) {
    return await ItemRepo.findOneBy({ key, storyId });
  }

  async getAchievement(key: string, userId: number) {
    if (this.achievements) {
      return this.achievements.find(a => a.key == key);
    } else {
      return await AchievementRepo.findOneBy({ key, user: userId });
    }
  }

  async getCircle(storyId: string, userId: number) {
    if (this.circle !== undefined) {
      return this.circle;
    } else {
      const ends = await EndRepo.find({
        where: { storyId, user: userId },
      });
      return ends.length + 1;
    }
  }

  async getTarget(key: string, storyId: string) {
    return await TargetRepo.findOneBy({ key, storyId });
  }

  async getStory(id: string): Promise<Story | Draft | null> {
    return await this.storyRepo.findOne({ where: [{ id }, { alias: id }] });
  }

  getProfileAttrName(profile: Profile, key: string) {
    return Array.isArray(profile.attrName) ? profile.attrName.find(item => item.key === key)?.name : profile.attrName[key];
  }

  async updateOptions(story: Scene, state: Profile, timezone: number, records?: Record[], achievements?: Achievement[]) {
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
      option.disabled = !(await this.checkConditions(option.conditions?.filter(c => c.isHide) || [], state, option, '', timezone, undefined).catch(() => false));
    }

    return story.options;
  }

  async checkConditions(conditions: Condition[], profile: Profile, option: any, valueText: string, timezone: number, itemTake?: Inventory) {
    function conditionOperator(left: number, right: number, operator: string) {
      switch (operator) {
        case '=':
          return left == right;
        case '!=':
          return left != right;
        case '>':
          return left > right;
        case '<':
          return left < right;
        case '≥':
          return left >= right;
        case '≤':
          return left <= right;
        default:
          return left >= right;
      }
    }

    const isItem = option?.value?.startsWith('item:');
    const isItems = option?.value?.startsWith('items:');

    for (const condition of conditions) {
      try {
        if (condition.type === 'Time') {
          if (!conditionCheckTime(condition, timezone)) {
            throw new Error(`还不是时候`);
          }
        }
        if (condition.type === 'Fn') {
          const fn = createFn('profile', 'inputText', 'itemSelect', 'let result = true;\n' + condition.content + '\nreturn result;');
          const result = callFn(fn, clone(profile), valueText, clone(itemTake), this.callLogs);
          if (result !== true) {
            throw new Error(typeof result != 'string' ? `你还没准备好` : result);
          }
        }
        if (condition.type === 'Target') {
          const item = await this.getTarget(condition.name, profile.storyId);
          if (!item) {
            throw new Error(`成就${condition.name}不存在`);
          }
          const achievement = await this.getAchievement(item.key, profile.userId);
          if (!achievement) {
            throw new Error(`你还没准备好。`);
          }
        }
        if (condition.type === 'Circle') {
          const circle = await this.getCircle(profile.storyId, profile.userId);
          if (!conditionOperator(circle, condition.content, condition.operator || '=')) {
            throw new Error(`你还没准备好。`);
          }
        }
        if (condition.type === 'From') {
          if (profile.from !== condition.content) {
            throw new Error(`你还没准备好。`);
          }
        }
        if (condition.type === 'Item') {
          const item = await this.getItem(condition.name, profile.storyId);
          if (!item) {
            throw new Error(`物品${condition.name}未找到`);
          }
          const inventory = itemTake || profile.inventory.find((i) => i.key === condition.name);
          if (inventory && inventory.key !== condition.name) {
            throw new Error(`不是这个`);
          }
          let count = parseInt(condition.content || '0');
          if (valueText && option.value && !isItem && !isItems) {
            count = parseInt(valueText) * count
          }
          if (isItems && itemTake) {
            count = itemTake.count;
          }
          if ((!inventory && condition.content === '') || !conditionOperator(inventory?.count || 0, count, condition.operator || '≥')) {
            if ((condition.operator || '>') == '>') throw new Error(`你需要 ${item.name}×${count}.`);
            else throw new Error('还不是时候');
          }
          itemTake = undefined;
        }
        if (condition.type === 'ItemType') {
          if (itemTake) {
            if (itemTake.type !== condition.content) {
              throw new Error(`不是这种物品`);
            }
            itemTake = undefined;
          } else {
            const inventory = profile.inventory.some((i) => i.type === condition.content && i.count > 0);
            if (!inventory) {
              throw new Error(`你需要 ${condition.content.toString()}.`);
            }
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
                  return conditionOperator(
                    i.attributes[attr] * i.count,
                    condition.content[attr].value || condition.content[attr],
                    condition.content[attr].operator || '≥'
                  );
                } else {
                  return conditionOperator(
                    i.attributes[attr],
                    condition.content[attr].value || condition.content[attr],
                    condition.content[attr].operator || '='
                  );
                }
              });
            });
            if (!inventory) {
              throw new Error(`你还没准备好.`);
            }
          } else if (itemTake) {
            const attrs = Object.keys(condition.content);
            const inventory = attrs.every((attr) => {
              if (condition.content[attr] === '') return !!itemTake!.attributes[attr];
              if (itemTake!.attributes[attr] === undefined) {
                return false;
              }
              if (typeof itemTake!.attributes[attr] === 'number') {
                return conditionOperator(
                  itemTake!.attributes[attr] * itemTake!.count,
                  condition.content[attr].value || condition.content[attr],
                  condition.content[attr].operator || '≥'
                );
              } else {
                return conditionOperator(
                  itemTake!.attributes[attr],
                  condition.content[attr].value || condition.content[attr],
                  condition.content[attr].operator || '='
                );
              }
            });
            if (!inventory) {
              throw new Error(`你还没准备好.`);
            }
            itemTake = undefined;
          }
        }
        if (condition.type === 'Attr') {
          for (const [key, value] of Object.entries(condition.content as { [key: string]: any })) {
            if (profile.attr[key] === undefined) {
              throw new Error(`你还没准备好.`);
            }
            if (typeof profile.attr[key] === 'number') {
              if (!conditionOperator(
                profile.attr[key],
                parseFloat(value.value ?? value.toString()),
                value.operator || '≥'
              )) {
                throw new Error(`你还没准备好.`);
              }
            } else {
              if (!conditionOperator(
                profile.attr[key],
                value.value ?? value,
                value.operator || '='
              )) {
                throw new Error(`你还没准备好.`);
              }
            }
          }
        }
        if (condition.type === 'Value') {
          if (Number(valueText).toString() == valueText && isNumber(Number(valueText))) {
            if (!conditionOperator(Number(valueText), Number(condition.content), condition.operator || '='))
              throw new Error(`数值错误`);
          } else if (condition.content.startsWith('/') && condition.content.replace(/[igm]+$/g, '').endsWith('/')) {
            if (!new RegExp(
              condition.content.replace(/[igm]+$/g, '')
              .slice(1, -1), 
              condition.content.match(/[igm]+$/g)?.[0]).test(valueText)
            ) {
              throw new Error(`数值错误`);
            }
          } else if ((!condition.operator || condition.operator == '=')) {
            if (valueText != condition.content) {
              throw new Error(`数值错误`);
            }
          } else if (valueText == condition.content) {
            throw new Error(`数值错误`);
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

  async runEffects(profile: Profile, effects: Effect[], option: any, valueText: string, timezone: number, itemTake?: Inventory, achievements?: any[], virtual = false) {
    try {
      let message = '', next = null;
      let needTip = true;
      for (const effect of effects) {
        if (effect.conditions?.length &&
          (!await this.checkConditions(effect.conditions, profile, option, valueText, timezone, itemTake)
            .catch(() => false))) {
          continue;
        }
        let msg = '', oldVal = '', newVal = '';
        effect.operator = effect.operator || '=';
        if (isString(effect.content)) {
          effect.content = effect.content.replace(/\$value/g, valueText);
          effect.content = effect.content.replaceAll('\\n', '\n');
        }
        if (effect.type === 'Target') {
          let target: Target | null | undefined;
          target = await this.getTarget(effect.name, profile.storyId);
          if (!target) throw new Error(`成就 ${effect.name} 不存在.`);
          let achievement = {
            user: profile.userId,
            fromProfile: profile.id,
            targetId: target.id,
            storyId: profile.storyId,
            key: target.key,
            name: target.name,
            description: target.description,
            from: profile.scene,
            time: Date.now(),
          } as Achievement;
          if (virtual) {
            if (!achievements?.some((a: Achievement) => a.key === achievement?.key)) {
              achievements?.push(achievement);
              msg += `获得成就 ${target.name}.\n`;
            }
          } else if (!(await AchievementRepo.findOneBy({ key: target.key, user: profile.userId }))) {
            const newAchievement = AchievementRepo.create(achievement);
            await AchievementRepo.save(newAchievement);
            msg += `获得成就 ${target.name}.\n`;
          }
        }
        if (effect.type === 'Item') {
          let item: Item & { count?: number; } | null | undefined;
          if (effect.name !== '$item') {
            item = await this.getItem(effect.name, profile.storyId);
            item && (item.count = 1);
          }
          else item = itemTake;
          if (!item) throw new Error(`物品 ${effect.name} 未找到.`)
          const inventory = profile.inventory.find((i) => i.key === item.key);
          if (effect.content.replace) effect.content = effect.content.replace(/\$count/g, (itemTake?.count || 1) + '');
          let count = formatContent(effect.content || '1', profile.attr, valueText, itemTake?.attributes);
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

          if (count) msg += `${count > 0 ? '获得' : '扣除'} ${item.name}×${Math.abs(count)}.\n`;
          else needTip = false;
        }
        if (effect.type === 'Scene') {
          const scene = effect.name;
          next = scene;
        }
        if (effect.type === 'Attr') {
          const oldValue = profile.attr[effect.name] || '';
          if (profile.attr[effect.name] === undefined) {
            const content = formatContent(effect.content || '1', profile.attr, valueText, itemTake?.attributes);
            profile.attr[effect.name] = content;
          }
          else if (typeof profile.attr[effect.name] === 'number') {
            effect.content = effect.content.replace(/\$count/g, itemTake?.count + '');
            let count = formatContent(effect.content || '1', profile.attr, valueText, itemTake?.attributes);
            if (!isNumber(count)) throw new Error(`Attr ${effect.name} 效果获取数量失败！`)
            profile.attr[effect.name] = operatorData(profile.attr[effect.name], count, effect.operator);
          }
          else {
            let content = fillVar(effect.content, '\\$', itemTake?.attributes);
            content = fillVar(content, '#', profile.attr);
            profile.attr[effect.name] = operatorData(profile.attr[effect.name], content, effect.operator);
          }
          if (this.getProfileAttrName(profile, effect.name)) {
            msg += `${this.getProfileAttrName(profile, effect.name)} ${oldValue} → ${profile.attr[effect.name]}.\n`;
          }
          oldVal = oldValue;
          newVal = profile.attr[effect.name];
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
            let count = formatContent(effect.content || '1', profile.attr, valueText);
            if (!isNumber(count)) throw new Error(`ItemAttr ${effect.name} 效果获取数量失败！`)
            let total = 0;
            for (const inventory of inventorys) {
              if (total >= count) break;
              if (inventory.attributes[attr] * inventory.count + total > count) {
                const itemCount = Math.ceil((count - total) / inventory.attributes[attr]);
                total += itemCount * inventory.attributes[attr];
                msg += `扣除 ${inventory.name}×${itemCount}.\n`;
                inventory.count -= itemCount;
              } else {
                total += inventory.attributes[attr] * inventory.count;
                msg += `扣除 ${inventory.name}×${inventory.count}.\n`;
                profile.inventory = profile.inventory.filter(i => i.key != inventory.key);
              }
            }
          } else {
            if (itemTake.attributes[effect.name] === undefined) {
              throw new Error(`物品 ${itemTake.name} 不包含属性 ${effect.name}.`);
            }
            let count = formatContent(effect.content || '1', profile.attr, valueText, itemTake.attributes);
            if (!isNumber(count)) throw new Error(`ItemAttr ${effect.name} 效果获取数量失败！`)
            const itemCount = Math.ceil(count / itemTake.attributes[effect.name]);
            if (itemCount > itemTake.count) {
              throw new Error(`物品 ${itemTake.name} 数量不足.`);
            }
            if (itemCount > 0) {
              msg += `扣除 ${itemTake.name}×${itemCount}.\n`;
              itemTake.count -= itemCount;
              if (itemTake.count <= 0) {
                profile.inventory = profile.inventory.filter(i => i.key != itemTake.key);
              }
            }
          }
        }
        if (effect.type === 'Fn') {
          const call = createFn('profile', 'inputText', 'itemSelect', 'addItem', 'setAttr', 'let message = "", next = null;\n' + effect.content + '\nreturn { message, next };');
          const items: any[] = []
          const result = callFn(call, clone(profile), valueText, clone(itemTake), (name: string, count: number) => {
            items.push({ name, count })
          }, (attr: { key: string; name?: string; value: string }) => {
            profile.attr[attr.key] = attr.value;
            if (attr.name) {
              if (Array.isArray(profile.attrName)) {
                const attrItem = profile.attrName.find(item => item.key === attr.key);
                if (attrItem) attrItem.name = attr.name;
                else profile.attrName.push({ key: attr.key, name: attr.name });
              } else {
                profile.attrName[attr.key] = attr.name;
              }
            }
          }, this.callLogs);

          for (const item of items) {
            const myItem = profile.inventory.find(i => i.key == item.name);
            if (myItem) myItem.count += item.count;
            else {
              const itemInstance = await this.getItem(item.name, profile.storyId);
              if (!itemInstance) throw new Error(`物品 ${item.name} 未找到.`)
              profile.inventory.push({ ...itemInstance, count: item.count || 1 })
            }
          }

          msg += result.message;
          next = result.next;
        }
        if (effect.tip && needTip) {
          msg = effect.tip.replace(/\$item/g, itemTake?.name || '')
            .replace(/\$count/g, (itemTake?.count || '') + '')
            .replace(/\$value/g, valueText || '')
            .replace(/\$old/g, oldVal || '')
            .replace(/\$new/g, newVal || '');
          msg = fillVar(msg, '\\$', itemTake?.attributes);
          msg = fillVar(msg, '#', profile.attr);
          msg += '\n'
        }
        message += msg;
      }

      return { message, next, profile };
    } catch (error) {
      throw error;
    }
  }

  async addEnd(scene: Scene, profile: Profile) {
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

  async restartGame(user: User, req: Request, res: Response) {
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
    } catch (err: any) {
      error(res, err.message)
    }
  }

  async resetGame(user: User, req: Request, res: Response, next: () => void) {
    try {
      const userId = user.id;
      const storyId = req.params.storyId;
      let { state } = await this.gameState(userId, storyId);

      if (this.type != 'draft') return next();

      const endId = state.endId;
      await ProfileRepo.delete({ userId, storyId, endId });
      await RecordRepo.delete({ user: userId, storyId, endId });

      json(res, { message: '游戏已重置' })
    } catch (err: any) {
      error(res, err.message)
    }
  }

  async resetAchievement(user: User, req: Request, res: Response, next: () => void) {
    try {
      const userId = user.id;
      const storyId = req.params.storyId;

      if (this.type != 'draft') return next();

      await AchievementRepo.delete({ user: userId, storyId });

      json(res, { message: '游戏成就已重置' })
    } catch (err: any) {
      error(res, err.message)
    }
  }

  async record(user: User, req: Request, res: Response, next: () => void) {
    try {
      const storyId = req.params.storyId;
      const story = this.story;

      let { p, count, end } = req.query;
      const page = Number(p || 1);
      const size = Math.min(Number(count || 50), 100);

      if (!story) return next()

      const profile = await ProfileRepo.findOneBy({
        isEnd: false,
        storyId,
        userId: user.id,
      });

      const ends = await EndRepo.find({
        where: {
          storyId,
          user: user.id,
        }
      });

      if (!end || !ends.some(p => p.endId == Number(end))) {
        end = (profile?.endId ?? '') + '';
      }

      const achievements = await AchievementRepo.find({
        where: { user: user.id, storyId },
        order: { time: 'DESC' },
      });

      if (!end) return render(res, 'record', req).title('游戏记录').logo(story.name).render({
        list: [],
        total: 0,
        page,
        size,
        story,
        endId: Number(end),
        ends,
        profile: {},
        type: this.type.slice(0, 1),
        achievements,
      });

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
        endId: Number(end),
        ends,
        profile: profile || {},
        type: this.type.slice(0, 1),
        achievements,
      })
    } catch (err: any) {
      error(res, err.message)
    }
  }

  async rank(user: User, req: Request, res: Response, next: () => void) {
    try {
      const storyId = req.params.storyId;
      const story = this.story;
      let { p, count } = req.query;
      const page = Number(p || 1);
      const size = Math.min(Number(count || 50), 100);

      if (!story) return next()

      const list = await RankRepo.find({
        where: { storyId, username: Not(story.author) },
        order: { endCount: 'DESC', achievementCount: 'DESC', totalCost: 'ASC' },
        take: size,
        skip: (page - 1) * size,
      }).then((data) => {
        return data.map((item) => ({
          ...item,
          totalCost: shortTime(item.totalCost),
        }))
      });

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

  async getContent(profile: Profile, scene: Scene, filter = false, timezone = new Date().getTimezoneOffset() / -60) {
    let content = scene.content;

    content = fillVar(content, '#', profile.attr);

    Object.entries(profile.attr).forEach(([key, value]) => {
      if (scene.content.includes(`\${${key}}`)) {
        scene.content = scene.content.replaceAll(`\${${key}}`, value + '');
      }
    });

    if (filter) {
      scene.options = await this.updateOptions(scene, profile, timezone);
    }
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

  async gameExcute(profile: Profile, scene: Scene, { option: optionText, value: valueText, timezone, achievements, circle, global, options }: any, virtual = false) {
    try {
      const storyId = profile.storyId;
      const storyOptions = this.story?.options || options as Option[];
      const userId = profile.userId;
      const option = !global ? scene?.options.find((option) => option.text === optionText) : storyOptions.find((option) => option.text === optionText);
      timezone = timezone ?? new Date().getTimezoneOffset() / -60;
      const oldProfile = clone(profile);
      this.achievements = achievements;
      this.circle = circle;

      let message = '';

      if (!option) {
        throw new Error('无效选项');
      }

      if (option?.value && !valueText) {
        throw new Error('缺少数值');
      }

      let itemTake: Inventory | undefined;
      const isItem = option?.value?.startsWith('item:');
      const isItems = option?.value?.startsWith('items:');
      if (isItem || isItems) {
        const values = valueText.split(':');
        const item = profile.inventory.find((i) => i.key === values[1]);
        if (!item) {
          throw new Error(`物品 ${option.value} 未找到.`);
        }
        itemTake = clone(item);
        itemTake.count = !isItems ? item.count : parseInt(values[2]);
      }

      if (option.conditions) {
        await this.checkConditions(option.conditions, profile, option, valueText, timezone, itemTake);
      }

      let next = option.next;
      let result = await this.runEffects(profile, option.effects || [], option, valueText, timezone, itemTake, achievements, virtual);
      if (result.next) next = result.next;
      if (result.message) message += result.message;
      if (result.profile) profile = result.profile;
      if (next === '<back>') {
        next = profile.from;
      }

      let nextScene = await this.getSence(next, storyId);

      if (!nextScene) {
        throw new Error('Oops! 前方无路……');
      }

      if (next != scene.name && nextScene?.attributes?.length) {
        profile.sceneAttr = nextScene.attributes.reduce((acc: any, cur: any) => { acc[cur.key] = cur.value, acc }, {});
      } else if (next != scene.name || !profile.sceneAttr) {
        profile.sceneAttr = {};
      }

      if (!virtual) {
        await RecordRepo.save({
          user: userId,
          storyId: storyId,
          scene: scene!.name,
          endId: profile.endId,
          from: profile.from,
          content: await this.getContent(oldProfile, scene, true, timezone),
          option: option.text,
          time: Date.now(),
        });
      }

      if (nextScene.name != scene!.name) profile.from = scene!.name;
      profile.scene = nextScene.name;

      const targets = await TargetRepo.findBy({ storyId });

      await Promise.all(targets.filter(t => t.conditions?.length).map(async (t) => {
        if (await this.checkConditions(t.conditions, profile, option, valueText, timezone).catch(() => false)) {
          let achievement = {
            user: userId,
            fromProfile: profile.id,
            targetId: t.id,
            storyId: storyId,
            key: t.key,
            name: t.name,
            description: t.description,
            from: profile.from,
            time: Date.now(),
          } as Achievement;
          if (virtual) {
            if (!achievements?.some((a: Achievement) => a.key === achievement?.key)) {
              achievements?.push(achievement);
              message += `获得成就 ${achievement.name}.\n`;
            }
          } else if (!(await AchievementRepo.findOneBy({ key: achievement.key, user: profile.userId }))) {
            const newAchievement = AchievementRepo.create(achievement);
            await AchievementRepo.save(newAchievement);
            message += `获得成就 ${achievement.name}.\n`;
          }
        };
      }));

      const globalEffects = this.story?.effects || [];
      if (globalEffects.length) {
        const { message: msg, next, profile: p } = await this.runEffects(profile, globalEffects, {}, '', timezone, undefined, this.achievements, virtual);
        message = msg;
        profile = p;
        if (next != scene?.name) {
          const scene = await this.getSence(next, storyId);
          if (scene) nextScene = scene;
        }
      }

      if (!virtual) {
        const currentState = await ProfileRepo.findOneBy({ userId, storyId, isEnd: false });
        if (currentState) {
          Object.assign(currentState, profile);
          await ProfileRepo.save(currentState);
        } else {
          profile = await ProfileRepo.save(profile);
        }
      }

      if (!virtual) {
        nextScene?.options && (nextScene.options = await this.updateOptions(nextScene, profile, timezone));

        if (nextScene.isEnd) {
          await this.addEnd(nextScene, profile);
        }
      }

      return {
        state: profile,
        scene: nextScene,
        next,
        message,
        content: await this.getContent(profile, nextScene),
        achievements,
      }
    } catch (err: any) {
      throw err;
    }
  }

  async optionFilter(req: Request, res: Response) {
    try {
      const { scene, profile, timezone, records, achievements, circle } = req.body;
      if (!scene) {
        throw new Error(`缺少运行场景！`);
      }
      if (!profile) {
        throw new Error(`缺少游戏资料！`);
      }
      this.achievements = achievements;
      this.circle = circle;
      scene.options = await this.updateOptions(scene, profile, timezone ?? new Date().getTimezoneOffset() / -60, records || []);
      const content = scene.content && (await this.getContent(profile, scene));
      const logs = records ? this.callLogs : undefined;
      json(res, {
        options: scene.options,
        content,
        logs,
      })
    } catch (err: any) {
      error(res, err.message)
    }
  }

  async gameVirtual(req: Request, res: Response) {
    try {
      let { profile, scene } = req.body;

      if (!scene) {
        throw new Error(`缺少运行场景！`);
      }

      if (!profile) {
        throw new Error(`缺少游戏资料！`);
      }

      const result = await this.gameExcute(profile, scene, req.body, true)

      json(res, { ...result, logs: this.callLogs })
    } catch (err: any) {
      error(res, err.message)
    }
  }

  async game(user: User, req: Request, res: Response) {
    try {
      const userId = user.id;
      const storyId = req.params.storyId;
      let { state: profile, scene, global } = await this.gameState(userId, storyId);

      if (!scene) {
        throw new Error(`场景${profile.scene}丢失！`);
      }

      if (global.options?.length) {
        global.options = await this.updateOptions({ name: '', options: global.options } as Scene, profile, req.body?.timezone ?? new Date().getTimezoneOffset() / -60);
      }

      const result = await this.gameExcute(profile, scene, req.body)
      scene = result.scene;

      json(res, {
        ...result,
        scene: {
          ...scene,
          options: scene.options.filter(o => !o.disabled).map(o => omit(o, ['conditions', 'effects'])),
        },
        global
      })
    } catch (err: any) {
      error(res, err.message)
    }
  }

  async storyList(req: Request, res: Response) {
    try {
      const visible = this.type == 'draft' ? {} : { visible: true };
      const stories = await this.storyRepo.find({
        where: { status: 2, ...visible },
        order: { createTime: 'DESC' },
      });
      const storyIds = stories.map((s) => s.id);
      let finish = [], achievements = [], endScenes = [], targetCounts = [];
      if (storyIds.length) {
        endScenes = storyIds.length ? await SceneRepo.createQueryBuilder("scene")
          .select("scene.storyId", "storyId")
          .addSelect("COUNT(*)", "count")
          .where("scene.storyId IN (:...storyIds)", { storyIds })
          .andWhere("scene.isEnd = :isEnd", { isEnd: true })
          .groupBy("scene.storyId")
          .getRawMany() : [];
        targetCounts = storyIds.length ? await TargetRepo.createQueryBuilder("target")
          .select("target.storyId", "storyId")
          .addSelect("COUNT(*)", "count")
          .where("target.storyId IN (:...storyIds)", { storyIds })
          .groupBy("target.storyId")
          .getRawMany() : [];
        if (req.session.user) {
          finish = await EndRepo.createQueryBuilder("end")
            .select("end.storyId", "storyId")
            .addSelect("COUNT(*)", "count")
            .where("end.storyId IN (:...storyIds)", { storyIds })
            .andWhere("end.user = :userId", { userId: req.session.user.id })
            .groupBy("end.storyId")
            .getRawMany();
          achievements = await AchievementRepo.createQueryBuilder("achievement")
            .select("achievement.storyId", "storyId")
            .addSelect("COUNT(*)", "count")
            .where("achievement.storyId IN (:...storyIds)", { storyIds })
            .andWhere("achievement.user = :userId", { userId: req.session.user.id })
            .groupBy("achievement.storyId")
            .getRawMany();
        }
      }
      render(res, 'stories', req).render({
        stories: stories.map((story) => {
          const end = endScenes.find((e) => e.storyId == story.id);
          const findEndItem = finish.find((e) => e.storyId == story.id);
          const targetCount = targetCounts.find((e) => e.storyId == story.id);
          const achievementCount = achievements.find((e) => e.storyId == story.id);
          return {
            ...story,
            end: end ? parseInt(end.count) : 0,
            finish: findEndItem ? parseInt(findEndItem.count) : 0,
            target: targetCount ? parseInt(targetCount.count) : 0,
            achievement: achievementCount ? parseInt(achievementCount.count) : 0,
          }
        }),
        isLogin: !!req.session.user,
      })
    } catch (error: any) {
      render(res, 'index', req).error(error.message).render()
    }
  }

  async init(user: User, req: Request, res: Response) {
    try {
      const userId = user.id;
      const story = this.story;

      if (!story) {
        return {};
      }

      const { state, scene, global } = await this.gameState(userId, req.params.storyId);

      const options = await this.updateOptions(
        scene!,
        state,
        req.body?.timezone ?? new Date().getTimezoneOffset() / -60
      ).then((options) => options.filter(o => !o.disabled));

      if (global.options?.length) {
        global.options = await this.updateOptions(
          { name: '', options: global.options } as Scene,
          state,
          req.body?.timezone ?? new Date().getTimezoneOffset() / -60
        );
      }

      return {
        state,
        scene: {
          ...scene,
          options: options.map(o => omit(o, ['conditions', 'effects'])),
        },
        global,
        story,
        content: await this.getContent(state, scene!)
      }

    } catch (error: any) {
      throw error;
    }
  }
}

