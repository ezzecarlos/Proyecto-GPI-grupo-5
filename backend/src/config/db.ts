import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbConfigAuth = {
  host: process.env.AUTH_DB_HOST || 'localhost',
  port: parseInt(process.env.AUTH_DB_PORT || '3307'),
  user: process.env.AUTH_DB_USER || 'auth_user',
  password: process.env.AUTH_DB_PASSWORD || 'auth_password',
  database: process.env.AUTH_DB_NAME || 'auth_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const dbConfigInventory = {
  host: process.env.INVENTORY_DB_HOST || 'localhost',
  port: parseInt(process.env.INVENTORY_DB_PORT || '3308'),
  user: process.env.INVENTORY_DB_USER || 'inventory_user',
  password: process.env.INVENTORY_DB_PASSWORD || 'inventory_password',
  database: process.env.INVENTORY_DB_NAME || 'inventory_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Crear pools de conexiones
export const authDbPool = mysql.createPool(dbConfigAuth);
export const inventoryDbPool = mysql.createPool(dbConfigInventory);

// Función de prueba para verificar conexiones en el arranque
export async function testDbConnections() {
  try {
    const authConn = await authDbPool.getConnection();
    console.log('✓ Conexión exitosa a la Base de Datos de Autenticación (auth_db)');
    authConn.release();
  } catch (error: any) {
    console.error('✗ Falló la conexión a la Base de Datos de Autenticación (auth_db):', error.message);
  }

  try {
    const invConn = await inventoryDbPool.getConnection();
    console.log('✓ Conexión exitosa a la Base de Datos de Inventario (inventory_db)');
    invConn.release();
  } catch (error: any) {
    console.error('✗ Falló la conexión a la Base de Datos de Inventario (inventory_db):', error.message);
  }
}
