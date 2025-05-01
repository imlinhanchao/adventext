import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Skill {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 技能名称
   */
  @Column('varchar', { length: 255, comment: '技能名称' })
  name: string;
  /**
   * 技能等级
   */
  @Column('int', { comment: '技能等级' })
  level: number;
  /**
   * 技能描述
   */
  @Column('text', { comment: '技能描述' })
  description: string;
  /**
   * 技能类型
   */
  @Column('varchar', { length: 50, comment: '技能类型' })
  type: string;
  /**
   * 技能效果
   */
  @Column('text', { comment: '技能效果' })
  effect: string;
  /**
   * 技能冷却时间
   */
  @Column('int', { comment: '技能冷却时间' })
  cooldown: number;
  /**
   * 技能消耗
   */
  @Column('json', { comment: '技能消耗' })
  cost: {
    hp: number;
    mp: number;
    gold: number;
  };
}