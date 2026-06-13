import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testDbConnections } from './config/db';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import movementRoutes from './routes/movement.routes';

// Cargar variables de entorno
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Probar conexión a bases de datos antes de arrancar la API
testDbConnections();

// Ruta de comprobación de estado (Health Check)
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Backend StockSmart funcionando correctamente.',
    timestamp: new Date()
  });
});

// Registrar rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/movements', movementRoutes);

// Manejo de errores global simple
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error no controlado:', err);
  res.status(500).json({
    message: 'Ocurrió un error inesperado en el servidor.',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Levantar el servidor
app.listen(port, () => {
  console.log(`🚀 Servidor backend ejecutándose en http://localhost:${port}`);
});
