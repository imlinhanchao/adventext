import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * @swagger
 * components:
 *   schemas:
 *     End:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         endId:
 *           type: integer
 *           description: 结局 ID
 *         user:
 *           type: integer
 *           description: 用户 ID
 *         storyId:
 *           type: string
 *           description: 故事 ID
 *         end:
 *           type: string
 *           description: 结局
 *         from:
 *           type: string
 *           description: 来源场景
 *         time:
 *           type: integer
 *           format: int64
 *           description: 触发时间
 *         cost:
 *           type: integer
 *           description: 耗费时间
 */
@Entity({ comment: '玩家解锁结局'})
export class End {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { comment: '结局 ID，绑定 Profile 和 Record' })
  endId: number;

  @Column('int', { comment: '用户 ID' })
  user: number;

  @Column('varchar', { length: 255, comment: '故事 ID' })
  storyId: string;

  @Column('varchar', { length: 255, comment: '结局' })
  end: string;

  @Column('varchar', { length: 255, comment: '来源场景' })
  from: string;

  @Column('bigint', { comment: '触发时间'})
  time: number;

  @Column('bigint', { comment: '耗费时间'})
  cost: number;
}