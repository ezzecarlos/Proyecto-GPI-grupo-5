import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import movementRoutes from './routes/movement.routes';
import userRoutes from './routes/user.routes';
import reportRoutes from './routes/report.routes';

const app = express();
const PORT = process.env.PORT || 5001; // Puerto adaptado a 5001

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/movements', movementRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);

// Iniciar servidor
app.listen(Number(PORT), '127.0.0.1', () => {
  console.log(`Servidor Backend corriendo en http://127.0.0.1:${PORT}`);
});