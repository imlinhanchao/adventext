import { ThirdParty, ThirdPartyRepo, User } from "../entities";
import { callFn, createFn } from "../utils/call";

export default class ThirdPartyInstance {
  static getAll() {
    return ThirdPartyRepo.find();
  }

  id: number;
  instance: ThirdParty;
  waited: Promise<boolean>;
  $auth: any;
  $verify: any;
  $user: any;

  constructor(id: number, $auth: Record<string, any>) {
    this.id = id;
    this.$auth = $auth;
    this.waited = ThirdPartyRepo.findOneBy({ id }).then((instance) => {
      if (!instance) return false;
      this.instance = instance;
      return true;
    });
  }

  async login() {
    if (!await this.waited) {
      throw new Error("Third party instance not found");
    }
    const verify = await this.verify();
    if (!verify) {
      throw new Error("认证失败！");
    }

    const user = await this.getUserInfo();
    console.log('get user Info', user);
    
    return this.createUser();
  }

  private async verify() {
    const { verifyUrl, verifyMethod, verifyParams, verifyFormula } = this.instance;
    const url = new URL(verifyUrl);
    const options: any = {
      method: verifyMethod,
    };
    if (verifyMethod === "POST") {
      for (const key in verifyParams) {
        if (verifyParams[key].includes("$auth")) {
          verifyParams[key] = callFn(createFn('$auth', 'return ' + verifyParams[key]), this.$auth);
        }
      }
      options.body = JSON.stringify(verifyParams);
      options.headers = {
        "Content-Type": "application/json",
      };
    } else {
      Object.entries(verifyParams).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    const response = await fetch(url.toString(), options);
    if (!response.ok) {
      throw new Error("Failed to verify");
    }
    const body = await response.text();
    try {
      this.$verify = JSON.parse(body);
    } catch (error) {
      this.$verify = body; 
    }
    return callFn(createFn('$auth', '$verify', 'return ' + verifyFormula), this.$auth, this.$verify);
  }

  private async getUserInfo() {
    const { userUrl, userMethod, userParams } = this.instance;
    const url = new URL(userUrl);
    const options: any = {
      method: userMethod,
    };
    if (userMethod === "POST") {
      for (const key in userParams) {
        if (userParams[key].includes("$auth")) {
          userParams[key] = callFn(createFn('$auth', '$verify', 'return ' + userParams[key]), this.$auth, this.$verify);
        } else {
          userParams[key] = userParams[key];
        }
      }
      options.body = JSON.stringify(userParams);
      options.headers = {
        "Content-Type": "application/json",
      };
    } else {
      Object.entries(userParams).forEach(([key, value]) => {
        if (value.includes("$auth") || value.includes("$verify")) {
          value = callFn(createFn('$auth', '$verify', 'return ' + value), this.$auth, this.$verify);
        }
        url.searchParams.append(key, value);
      });
    }
    const response = await fetch(url.toString(), options);
    if (!response.ok) {
      throw new Error("Failed to get user info");
    }
    this.$user = await response.json();
    return this.$user;
  }

  createUser() {
    const { userKey, prefix } = this.instance;
    const user = new User();
    user.username = prefix + callFn(
      createFn('$auth', '$verify', '$user', 'return ' + userKey.username), 
      this.$auth, this.$verify, this.$user
    );
    user.nickname = callFn(
      createFn('$auth', '$verify', '$user', 'return ' + userKey.nickname), 
      this.$auth, this.$verify, this.$user
    );
    user.attr = {
      from: this.instance.name,
      info: this.$user,
    }

    if (!user.username) {
      throw new Error("获取用户名失败！");
    }
    
    return user;
  }
}