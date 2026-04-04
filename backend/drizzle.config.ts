import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DB_URL ?? './edgebind.db',
  },
} satisfies Config;
