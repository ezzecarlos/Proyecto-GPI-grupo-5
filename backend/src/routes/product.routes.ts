import { Router } from 'express';
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/product.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken as any);

router.get('/', getAllProducts as any);
router.get('/:id', getProductById as any);
router.post('/', createProduct as any);
router.put('/:id', updateProduct as any);
router.delete('/:id', deleteProduct as any);

export default router;
