import { Router } from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct, getPredictiveAlerts } from '../controllers/product.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/rbac.middleware';

const router = Router();

router.use(verifyToken); // Protege todas las rutas de productos

router.get('/', getProducts); // Todos los roles autenticados pueden ver productos
router.get('/predictive-alerts', getPredictiveAlerts); // Endpoint para calcular quiebre predictivo
router.post('/', checkRole(['ADMINISTRADOR', 'BODEGUERO']), createProduct);
router.put('/:id', checkRole(['ADMINISTRADOR', 'BODEGUERO']), updateProduct);
router.delete('/:id', checkRole(['ADMINISTRADOR']), deleteProduct); // Solo administrador puede eliminar (desactivar)

export default router;