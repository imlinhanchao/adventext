import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Item } from './Item';

export class Attr {
  /**
   * 力量
   */
  strength = 1;
  /**
   * 防御
   */
  defense = 1;
  /**
   * 魔力
   */
  magic = 0;
  /**
   * 视力
   */
  vision = 1;
  /**
   * 敏捷
   */
  dexterity = 1;
}

export class State {
  /**
   * 生命值
   */
  hp = 50;
  /**
   * 体力值
   */
  mp = 50;
  /**
   * 经验值
   */
  exp = 0;
  /**
   * 等级
   */
  level = 1;
  /**
   * 运气
   */
  luck = 1;
  /**
   * 技能点
   */
  skillPoint = 5;
}

export class Skill {
  /**
   * 技能名称
   */
  name: string;
  /**
   * 技能等级
   */
  level: number;
  /**
   * 技能描述
   */
  description: string;
  /**
   * 技能类型
   */
  type: string;
  /**
   * 技能效果
   */
  effect: string;
  /**
   * 技能冷却时间
   */
  cooldown: number;
  /**
   * 技能消耗
   */
  cost: {
    hp: number;
    mp: number;
    gold: number;
  };
}

export class Inventory extends Item {
  /**
   * 物品数量
   */
  count: number;
}

@Entity()
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { comment: '用户ID' })
  userId: number;

  @Column('varchar', { length: 255, comment: '当前场景' })
  scene: string;

  @Column('varchar', { length: 255, comment: '来源场景' })
  from: string;

  @Column('int', { comment: '金币' })
  gold: number;

  @Column('json', { comment: '物品栏' })
  inventory: Inventory[];

  @Column('json', { comment: '属性' })
  attr: Attr;

  @Column('json', { comment: '状态' })
  state: State;

  @Column('json', { comment: '技能' })
  skills: Skill[];

  constructor(user: number) {
    this.userId = user;
    this.scene = 'start';
    this.from = '';
    this.inventory = [];
    this.gold = 0;
    this.attr = new Attr();
    this.state = new State();
    this.skills = [];
  }
}