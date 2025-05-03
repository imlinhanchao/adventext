import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Record {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { comment: '用户 ID' })
  user: number;

  @Column('int', { comment: '故事 ID' })
  storyId: number;

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