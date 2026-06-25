"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRole = void 0;
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user || !user.role) {
            return res.status(403).json({ message: 'Acceso denegado: usuario no autenticado o sin rol' });
        }
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ message: 'Acceso denegado: permisos insuficientes para esta acción' });
        }
        next();
    };
};
exports.checkRole = checkRole;
