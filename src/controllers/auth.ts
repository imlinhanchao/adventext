import crypto from "crypto";
import { UserRepo } from '../entities';
import { User } from '../entities/User';
import { generateToken } from "../utils/auth";
import utils, { omit } from '../utils';

export async function login(params: { username: string; password: string }, needToken = false) {
  const { username, password } = params;
  let user = await UserRepo.findOne({ where: { username } });

  if (!user) {
    throw new Error("用户名或密码错误");
  }

  const sha256 = crypto.createHash('sha256');
  const hashedPassword = sha256.update(password + utils.config.secret.salt).digest('hex');

  const isValid = hashedPassword == user.password;
  if (!isValid) {
    throw new Error("用户名或密码错误");
  }

  user.lastLogin = Date.now();
  await UserRepo.save(user);

  if (needToken) {
    const token = generateToken({ id: user!.id });
    return { user: omit(user, User.unsafeKey), token };
  }

  return { user: omit(user, User.unsafeKey) };
}

export async function register(params: { username: string; password: string }) {
  const { username, password } = params;
  const existingUser = await UserRepo.findOne({ where: { username } });
  if (existingUser) {
    throw new Error("用户名已存在");
  }

  const sha256 = crypto.createHash('sha256');
  const hashedPassword = sha256.update(password + utils.config.secret.salt).digest('hex');
  const user = new User(username, hashedPassword)
  // 第一个用户默认为管理员
  const first = await UserRepo.findOne({});
  if (!first) {
    user.isAdmin = true;
  }

  const newUser = UserRepo.create(user);
  return await UserRepo.save(newUser);
}

export async function profile(userId: number) {
  const user = await UserRepo.findOne({ where: { id: userId } });
  if (!user) {
    throw new Error("用户不存在");
  }
  user.lastLogin = Date.now();
  await UserRepo.save(user);
  return omit(user, User.unsafeKey);
}