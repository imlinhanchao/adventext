import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Condition } from './Scene';

/**
 * @swagger
 * components:
 *   schemas:
 *     Target:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         storyId:
 *           type: string
 *           description: 故事 ID
 *         key:
 *           type: string
 *           description: 唯一标识
 *         name:
 *           type: string
 *           description: 名称
 *         description:
 *           type: string
 *           description: 描述
 *         conditions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Condition'
 *           description: 解锁成就的条件
 */
@Entity({ comment: '可解锁成就'})
export class Target {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 255, comment: '故事 ID' })
  storyId: string;

  @Column('varchar', { length: 200, comment: '唯一标识' })
  key: string;

  @Column('varchar', { length: 200, comment: '名称' })
  name: string;

  @Column('varchar', { length: 1024, comment: '描述' })
  description: string;

  @Column("json", { comment: '解锁成就的条件' })
  conditions: Condition[] = [];
  
}