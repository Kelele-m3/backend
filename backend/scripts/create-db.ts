// scripts/create-db.ts
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load .env from project root (parent of backend/)
dotenv.config({ path: join(process.cwd(), '..', '.env') });

async function createDB() {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: 'postgres', // connect to default db first
  });

  await client.connect();
  await client.query(`CREATE DATABASE "${process.env.DATABASE_NAME}"`);
  console.log(`Database ${process.env.DATABASE_NAME} created!`);
  await client.end();
}

createDB().catch(console.error);