import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    nombre_completo: string;
    email: string;
    rol: 'ADMIN' | 'BODEGUERO' | 'VENDEDOR';
    empresa_id: number;
    sucursal_id: number | null;
  };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token de acceso no proporcionado.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'stocksmart_jwt_default', (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token de acceso inválido o expirado.' });
    }
    
    req.user = decoded as AuthenticatedRequest['user'];
    next();
  });
}
