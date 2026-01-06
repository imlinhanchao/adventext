import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       description: 用户
 *       properties:
 *         id:
 *           type: integer
 *         username:
 *           type: string
 *           description: 用户名
 *         nickname:
 *           type: string
 *           description: 昵称
 *         isAdmin:
 *           type: boolean
 *           description: 是否为管理员
 *         lastLogin:
 *           type: integer
 *           format: int64
 *           description: 上次登录时间
 *         attr:
 *           type: object
 *           description: 第三方信息
 */
@Entity({ comment: '用户表'})
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: "用户名" })
  username: string;

  @Column({ comment: "昵称" })
  nickname: string;

  @Column({ comment: "密码" })
  password: string;

  @Column({ default: false, comment: "是否为管理员" })
  isAdmin: boolean = false;

  @Column('bigint', { comment: "上次登录时间" })
  lastLogin: number = 0;

  @Column('json', { comment: "第三方信息" })
  attr: any = {};

  static get unsafeKey() {
    return ['password', 'attr'];
  }

  constructor(username: string = '', password: string = '') {
    this.username = username;
    this.nickname = username;
    this.password = password;
  }
}