import { Request, Response, NextFunction } from 'express';

export const checkRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user || !user.role) {
      return res.status(403).json({ message: 'Acceso denegado: usuario no autenticado o sin rol' });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Acceso denegado: permisos insuficientes para esta acción' });
    }

    next();
  };
};
