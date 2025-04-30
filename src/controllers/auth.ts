import bcrypt from "bcrypt";
import { AppDataSource } from '../entities';
import { User } from '../entities/User';
import { generateToken } from "../utils/auth";

export async function login(params: { username: string; password: string }, needToken=false) {
  const { username, password } = params;
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { username } });

  if (!user) {
    throw new Error("Username or Password is wrong." );
  }

  const isValid = await bcrypt.compare(password, user.password!);
  if (!isValid) {
    throw new Error("Username or Password is wrong." );
  }

  if (needToken) {
    const token = generateToken({ id: user.id });
    return { token };
  }

  return { user };
}