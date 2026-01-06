import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

/**
 * @swagger
 * components:
 *   schemas:
 *     Option:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         text:
 *           type: string
 *           description: 选项文本
 *         next:
 *           type: string
 *           description: 下一个场景ID
 *         loop:
 *           type: integer
 *           description: 循环次数
 *         disabled:
 *           type: boolean
 *           description: 是否禁用
 *         conditions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Condition'
 *           description: 出现条件
 *         effects:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Effect'
 *           description: 触发效果
 */
export class Option {
  id?: string;
  text: string;
  shortcut?: string;
  append?: string;
  antiAppend?: string; 
  next: string;
  loop?: number;
  disabled?: boolean;
  value?: string;
  conditions?: Condition[];
  effects?: Effect[];

  constructor(text: string, next: string, conditions?: Condition[], effects?: Effect[]) {
    this.text = text;
    this.next = next;
    this.conditions = conditions;
    this.effects = effects;
  }
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Condition:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           description: 条件类型
 *         name:
 *           type: string
 *           description: 属性名
 *         content:
 *           type: object
 *           description: 条件内容
 *         tip:
 *           type: string
 *           description: 提示信息
 *         operator:
 *           type: string
 *           description: 运算符
 *         isHide:
 *           type: boolean
 *           description: 是否隐藏
 */
export class Condition {
  type: string;
  name: string;
  content: any;
  tip: string;
  operator?: string;
  isHide: boolean = false;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Effect:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           description: 效果类型
 *         name:
 *           type: string
 *           description: 属性名
 *         operator:
 *           type: string
 *           description: 运算符
 *         content:
 *           type: string
 *           description: 效果内容
 *         tip:
 *           type: string
 *           description: 提示信息
 *         conditions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Condition'
 *           description: 触发条件
 */
export class Effect {
  type: string;
  name: string;
  operator?: string;
  content: string;
  tip?: string;
  conditions?: Condition[];

  constructor(name: string, type: string, content: string) {
    this.name = name;
    this.type = type;
    this.content = content;
  }
}

export class IAttribute {
  key: string;
  name: string;
  type: string;
  value: any;
  remark?: string;

  constructor(key: string, name: string, type: string, value: any, remark?: string) {
    this.key = key;
    this.name = name;
    this.type = type;
    this.value = value;
    this.remark = remark;
  }
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Scene:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         storyId:
 *           type: string
 *           description: 故事 ID
 *         name:
 *           type: string
 *           description: 场景名称
 *         content:
 *           type: string
 *           description: 场景描述
 *         options:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Option'
 *           description: 场景选项
 *         theEnd:
 *           type: string
 *           description: 结局名称
 *         isEnd:
 *           type: boolean
 *           description: 是否结局
 *         position:
 *           type: object
 *           description: 面板位置
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: 场景标签
 */
@Entity({ comment: '场景'})
export class Scene {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 255, comment: '故事 ID' })
  storyId: string;

  @Column('varchar', { length: 255, comment: '场景名称' })
  name: string;

  @Column("text", { comment: '场景描述' })
  content: string;

  @Column("json", { comment: '场景选项' })
  options: Option[];

  @Column("varchar", { length: 255, comment: '结局名称' })
  theEnd: string;

  @Column({ comment: '是否结局' })
  isEnd: boolean;

  @Column("json", { comment: '面板位置' })
  position: { x: number, y: number, w?: number, h?: number };

  @Column("text", { nullable: true, comment: '自定义样式' })
  customStyle: string;

  @Column({ comment: '场景渲染模式(废弃)', default: 0 })
  renderMode: number = 0;

  @Column("simple-array", { comment: '场景标签' })
  tags: string[] = [];

  @Column("json", { nullable: true, comment: '场景属性' })
  attributes?: IAttribute[];

  @Column("json", { nullable: true, comment: '进入场景效果' })
  enterEffects?: Effect[];

  @Column("json", { nullable: true, comment: '离开场景效果' })
  leaveEffects?: Effect[];

  @Column('bigint', { comment: "创建时间" })
  createTime: number = 0;
  
  @Column('bigint', { comment: "更新时间" })
  updateTime: number = 0;
}