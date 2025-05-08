import { Request, Response } from "express";
import utils from './index'

class Render {
  req?: Request;
  res: Response;
  params: any;
  name: string;
  config: any;
  constructor(res: Response, name: string, req?: Request) {
    this.res = res;
    this.req = req;
    this.name = name;
    this.params = {}
    const { database, secret, ...rest } = utils.config || {};
    this.config = rest;
  }

  title(title: string) {
    this.params.title = title;
    return this;
  }

  message(message: string, type: string = 'error') {
    this.params.message = message;
    this.params.type = type;
    return this;
  }

  error(message: string) {
    this.message(message, 'error');
    return this;
  }

  success(message: string) {
    this.message(message, 'success');
    return this;
  }

  warning(message: string) {
    this.message(message, 'warning');
    return this;
  }

  location(location: string) {
    this.params.location = location
    return this;
  }

  logo(logo: string) {
    this.params.logo = logo;
  }

  render(params: any = {}) {
    this.res.render(this.name, {
      name: this.name,
      logo: this.params.logo || this.config.name,
      config: this.config,
      body: this.req?.body,
      query: this.req?.query,
      params: this.req?.params,
      ...this.params,
      ...params,
      user: this.req?.session?.user,
    });
  }
}

export function render(res: Response, name: string, req?: Request) {
  return new Render(res, name, req);
}

export function json(res: Response, data: any, message?: string) {
  res.json({ code: 0, data, message });
}

export function error(res: Response, message: string, code=-1) {
  res.json({ code, message });
}