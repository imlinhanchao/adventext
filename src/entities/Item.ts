import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * @swagger
 * components:
 *   schemas:
 *     Item:
 *       type: object
 *       description: 物品
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
 *         type:
 *           type: string
 *           description: 类型
 *         attributes:
 *           type: object
 *           description: 属性
 *         createTime:
 *           type: integer
 *           format: int64
 *           description: 创建时间
 *         updateTime:
 *           type: integer
 *           format: int64
 *           description: 更新时间
 */
@Entity({ comment: '物品'})
export class Item {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 255, comment: '故事 ID' })
  storyId: string;

  @Column('varchar', { length: 200, comment: '唯一标识' })
  key: string;

  @Column('varchar', { length: 200, comment: '名称' })
  name: string;

  @Column('text', { comment: '描述' })
  description: string;

  @Column('varchar', { length: 200, comment: '类型' })
  type: string;

  @Column('json', { comment: '属性', nullable: true })
  attributes: {
    [key: string]: any;
  };
  
  @Column('json', { comment: '属性名称', nullable: true })
  attrName: { [key: string]: string };

  @Column('bigint', { comment: "创建时间" })
  createTime: number = 0;
  
  @Column('bigint', { comment: "更新时间" })
  updateTime: number = 0;
}