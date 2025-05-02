import crypto from "crypto";
import { AppDataSource } from '../entities';
import { User } from '../entities/User';
import { generateToken } from "../utils/auth";
import utils from '../utils';

export async function login(params: { username: string; password: string }, needToken = false) {
  const { username, password } = params;
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { username } });

  if (!user) {
    throw new Error("用户名或密码错误");
  }

  const sha256 = crypto.createHash('sha256');
  const hashedPassword = sha256.update(password + utils.config.secret.salt).digest('hex');

  const isValid = hashedPassword == user.password;
  if (!isValid) {
    throw new Error("用户名或密码错误");
  }

  if (needToken) {
    const token = generateToken({ id: user.id });
    return { user, token };
  }

  return { user };
}

export async function register(params: { username: string; password: string }) {
  const { username, password } = params;
  const userRepository = AppDataSource.getRepository(User);
  const existingUser = await userRepository.findOne({ where: { username } });
  if (existingUser) {
    throw new Error("用户名已存在");
  }

  const sha256 = crypto.createHash('sha256');
  const hashedPassword = sha256.update(password + utils.config.secret.salt).digest('hex');

  const newUser = userRepository.create({ username, password: hashedPassword });
  return await userRepository.save(newUser);
}

export async function profile(userId: number) {
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { id: userId } });
  if (!user) {
    throw new Error("用户不存在");
  }
  return user;
}