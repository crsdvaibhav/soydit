import "reflect-metadata"
import { MiddlewareFn } from "type-graphql";
import { MyContext } from "../types";

export const isAuth: MiddlewareFn<MyContext> = ({ context }, next) => {
  if (!context.req.session.userId) {
    throw new Error("Not authenticated: Login/Create Account!");
  }

  return next();
};