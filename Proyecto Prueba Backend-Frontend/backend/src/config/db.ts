import { Pool } from 'pg';
import dotenv from 'dotenv';

// Carga las variables del archivo .env
dotenv.config();

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Esto previene que el servidor colapse si la base de datos se cae de forma intermitente
pool.on('error', (err: Error) => {
  console.error('Error crítico inesperado en el pool de PostgreSQL:', err.message);
});