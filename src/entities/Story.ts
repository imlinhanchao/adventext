import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Draft } from './Draft';

/**
 * @swagger
 * components:
 *   schemas:
 *     Story:
 *       allOf:
 *         - $ref: '#/components/schemas/Draft'
 *         - type: object
 *           properties:
 *             sourceId:
 *               type: string
 *               description: 来源故事ID
 *             visible:
 *               type: boolean
 *               description: 是否可见
 */
@Entity({ comment: '已发布故事'})
export class Story extends Draft {

  @Column('varchar', { length: 255, comment: '来源故事ID' })
  sourceId: string;

  @Column('boolean', { default: true, comment: '是否可见' })
  visible: boolean;

  constructor() {
    super();
    this.visible = true;
  }
}