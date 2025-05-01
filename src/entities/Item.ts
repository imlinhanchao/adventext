import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ comment: '物品'})
export class Item {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 200, comment: '唯一标识' })
  key: string;

  @Column('varchar', { length: 200, comment: '名称' })
  name: string;

  @Column('text', { comment: '描述' })
  description: string;

  @Column('varchar', { length: 200, comment: '类型' })
  type: string;

  @Column('json', { comment: '属性' })
  attributes: {
    [key: string]: any;
  };
}