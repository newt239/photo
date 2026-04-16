import { drizzle } from 'drizzle-orm/d1'

import * as schema from './schema.ts'

export const getDb = (d1: D1Database) => drizzle(d1, { schema })
