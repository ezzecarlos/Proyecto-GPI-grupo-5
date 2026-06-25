import { Router } from 'express';
import { getInventoryReport } from '../controllers/report.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Protege el endpoint de reportes con autenticación JWT
router.use(verifyToken);

router.get('/inventory', getInventoryReport);

export default router;
