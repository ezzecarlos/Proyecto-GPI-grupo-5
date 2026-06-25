"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("../controllers/product.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyToken); // Protege todas las rutas de productos
router.get('/', product_controller_1.getProducts); // Todos los roles autenticados pueden ver productos
router.get('/predictive-alerts', product_controller_1.getPredictiveAlerts); // Endpoint para calcular quiebre predictivo
router.post('/', (0, rbac_middleware_1.checkRole)(['ADMINISTRADOR', 'BODEGUERO']), product_controller_1.createProduct);
router.put('/:id', (0, rbac_middleware_1.checkRole)(['ADMINISTRADOR', 'BODEGUERO']), product_controller_1.updateProduct);
router.delete('/:id', (0, rbac_middleware_1.checkRole)(['ADMINISTRADOR']), product_controller_1.deleteProduct); // Solo administrador puede eliminar (desactivar)
exports.default = router;
