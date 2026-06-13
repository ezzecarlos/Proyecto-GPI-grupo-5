import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authDbPool } from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'El correo y la contraseña son requeridos.' });
  }

  try {
    // Buscar usuario en auth_db
    const [rows]: any = await authDbPool.query(
      'SELECT id, empresa_id, sucursal_id, nombre_completo, email, password_hash, rol, estado FROM usuarios WHERE email = ? LIMIT 1',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Correo electrónico o contraseña incorrectos.' });
    }

    const user = rows[0];

    if (user.estado !== 'Activo') {
      return res.status(403).json({ message: `La cuenta de usuario está ${user.estado}.` });
    }

    // Validar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      // Para desarrollo rápido y demostración, también permitimos contraseña en texto plano si coincide exactamente con el hash
      // Pero por seguridad usamos hash. En la semilla la contraseña es "admin123" y el hash es correcto
      return res.status(401).json({ message: 'Correo electrónico o contraseña incorrectos.' });
    }

    // Generar JWT Token
    const tokenPayload = {
      id: user.id,
      nombre_completo: user.nombre_completo,
      email: user.email,
      rol: user.rol,
      empresa_id: user.empresa_id,
      sucursal_id: user.sucursal_id,
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'stocksmart_jwt_default',
      { expiresIn: '8h' }
    );

    // Registrar en auditoria_accesos
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    await authDbPool.query(
      'INSERT INTO auditoria_accesos (id_usuario, direccion_ip, dispositivo_navegador) VALUES (?, ?, ?)',
      [user.id, ip, userAgent]
    );

    return res.json({
      token,
      user: {
        id: user.id,
        nombre_completo: user.nombre_completo,
        email: user.email,
        rol: user.rol,
        empresa_id: user.empresa_id,
        sucursal_id: user.sucursal_id,
      }
    });

  } catch (error: any) {
    console.error('Error en login:', error);
    return res.status(500).json({ message: 'Error interno del servidor al iniciar sesión.', error: error.message });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'No autenticado.' });
  }
  return res.json({ user: req.user });
}
