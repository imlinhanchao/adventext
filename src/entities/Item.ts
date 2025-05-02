import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ comment: '物品'})
export class Item {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { comment: '故事 ID' })
  storyId: number;

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
  
  @Column('json', { comment: '属性名称' })
  attrName: { [key: string]: string };
}