import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class End {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { comment: '用户 ID' })
  user: number;

  @Column('int', { comment: '故事 ID' })
  storyId: number;

  @Column('varchar', { length: 255, comment: '结局' })
  end: string;

  @Column('varchar', { length: 255, comment: '来源场景' })
  from: string;

  @Column('bigint', { comment: '选择时间'})
  time: number;
}