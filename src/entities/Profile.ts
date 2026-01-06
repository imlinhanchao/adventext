import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Item } from './Item';

/**
 * @swagger
 * components:
 *   schemas:
 *     Inventory:
 *       allOf:
 *         - $ref: '#/components/schemas/Item'
 *         - type: object
 *           properties:
 *             count:
 *               type: integer
 *               description: 物品数量
 */
export class Inventory extends Item {
  /**
   * 物品数量
   */
  count: number;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Profile:
 *       type: object
 *       description: 玩家档案
 *       properties:
 *         id:
 *           type: integer
 *         userId:
 *           type: integer
 *           description: 用户ID
 *         storyId:
 *           type: string
 *           description: 故事 ID
 *         scene:
 *           type: string
 *           description: 当前场景
 *         from:
 *           type: string
 *           description: 来源场景
 *         inventory:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Inventory'
 *           description: 物品栏
 *         attr:
 *           type: object
 *           description: 属性
 *         sceneAttr:
 *           type: object
 *           description: 场景属性
 *         isEnd:
 *           type: boolean
 *           description: 已经结局
 *         createTime:
 *           type: integer
 *           format: int64
 *           description: 创建时间
 *         updateTime:
 *           type: integer
 *           format: int64
 *           description: 更新时间
 */
@Entity({ comment: '玩家档案' })
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { comment: '用户ID' })
  userId: number;

  @Column('varchar', { length: 255, comment: '故事 ID' })
  storyId: string;

  @Column('varchar', { length: 255, comment: '当前场景' })
  scene: string;

  @Column('varchar', { length: 255, comment: '来源场景' })
  from: string;

  @Column('json', { comment: '物品栏' })
  inventory: Inventory[];

  @Column('json', { comment: '属性' })
  attr: any;

  @Column('json', { comment: '场景属性' })
  sceneAttr: any;

  @Column('json', { comment: '属性名称' })
  attrName: { [key: string]: [string, string] | string } | { key: string; name: string; }[] = [];

  @Column('int', { comment: '结局 ID' })
  endId: number;

  @Column({ comment: '已经结局' })
  isEnd: boolean;

  @Column('bigint', { comment: "创建时间" })
  createTime: number = 0;
  
  @Column('bigint', { comment: "更新时间" })
  updateTime: number = 0;

  constructor(user: number, storyId: string) {
    this.userId = user;
    this.storyId = storyId;
    this.scene = '';
    this.from = '';
    this.inventory = [];
    this.attr = {};
    this.attrName = {};
    this.endId = Date.now() / 1000;
    this.isEnd = false;
    this.createTime = Date.now();
  }
}