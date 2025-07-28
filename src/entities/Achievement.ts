import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Achievement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { comment: '用户 ID' })
  user: number;

  @Column('int', { comment: '来源的Profile' })
  fromProfile: number;

  @Column('int', { comment: '成就原始 ID' })
  targetId: number;

  @Column('varchar', { length: 255, comment: '故事 ID' })
  storyId: string;

  @Column('varchar', { length: 200, comment: '唯一标识' })
  key: string;

  @Column('varchar', { length: 255, comment: '名称' })
  name: string;

  @Column('varchar', { length: 1024, comment: '描述' })
  description: string;

  @Column('varchar', { length: 255, comment: '来源场景' })
  from: string;

  @Column('bigint', { comment: '触发时间'})
  time: number;
}