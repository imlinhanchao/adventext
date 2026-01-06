import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * @swagger
 * components:
 *   schemas:
 *     Record:
 *       type: object
 *       description: 玩家游玩记录
 *       properties:
 *         id:
 *           type: integer
 *         user:
 *           type: integer
 *           description: 用户 ID
 *         storyId:
 *           type: string
 *           description: 故事 ID
 *         scene:
 *           type: string
 *           description: 场景
 *         from:
 *           type: string
 *           description: 来源场景
 *         content:
 *           type: string
 *           description: 内容
 *         option:
 *           type: string
 *           description: 选项
 *         time:
 *           type: integer
 *           format: int64
 *           description: 选择时间
 *         endId:
 *           type: integer
 *           description: 结局 ID
 */
@Entity({ comment: '玩家游玩记录'})
export class Record {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { comment: '用户 ID' })
  user: number;

  @Column('varchar', { length: 255, comment: '故事 ID' })
  storyId: string;

  @Column('varchar', { length: 255, comment: '场景' })
  scene: string;

  @Column('varchar', { length: 255, comment: '来源场景' })
  from: string;

  @Column("text", { comment: '内容' })
  content: string;

  @Column('varchar', { length: 500, comment: '选项' })
  option: string;

  @Column('bigint', { comment: '选择时间'})
  time: number;

  @Column('int', { comment: '结局 ID' })
  endId: number;
}