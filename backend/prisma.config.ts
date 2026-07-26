import * as dotenv from 'dotenv';
import { defineConfig, env } from 'prisma/config';

dotenv.config();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
