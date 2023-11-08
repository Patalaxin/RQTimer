import * as process from "process";

export const jwtConstants: { secret: string } = {
  secret: process.env.SECRET_CONSTANT,
};
