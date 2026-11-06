// Shared settings and connections for the search scripts.
import 'dotenv/config';
import mysql from 'mysql2/promise';
import { QdrantClient } from '@qdrant/js-client-rest';

export const COLLECTION = 'materials';
export const VECTOR_SIZE = 384;            // all-MiniLM-L6-v2 produces 384 numbers per text

export function getDb() {
  return mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
}

export const qdrant = new QdrantClient({ url: process.env.QDRANT_URL || 'http://localhost:6333' });
