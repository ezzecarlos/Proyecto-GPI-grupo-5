import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT id, name, email, role FROM users ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios (nombre, email, password, rol)' });
  }

  // Validar rol
  if (!['ADMINISTRADOR', 'BODEGUERO', 'VENDEDOR'].includes(role)) {
    return res.status(400).json({ message: 'Rol inválido. Debe ser ADMINISTRADOR, BODEGUERO o VENDEDOR' });
  }

  try {
    // Verificar si el correo ya existe
    const existsResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existsResult.rows.length > 0) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4) RETURNING id, name, email, role`,
      [name, email, passwordHash, role]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ message: 'Error al crear usuario' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, password, role } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ message: 'Nombre, email y rol son obligatorios' });
  }

  // Validar rol
  if (!['ADMINISTRADOR', 'BODEGUERO', 'VENDEDOR'].includes(role)) {
    return res.status(400).json({ message: 'Rol inválido. Debe ser ADMINISTRADOR, BODEGUERO o VENDEDOR' });
  }

  try {
    // Verificar si el usuario existe
    const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar si el correo ya existe en otro usuario
    const existsResult = await pool.query('SELECT id FROM users WHERE email = $1 AND id <> $2', [email, id]);
    if (existsResult.rows.length > 0) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado por otro usuario' });
    }

    let result;
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      result = await pool.query(
        `UPDATE users 
         SET name = $1, email = $2, password = $3, role = $4 
         WHERE id = $5 RETURNING id, name, email, role`,
        [name, email, passwordHash, role, id]
      );
    } else {
      result = await pool.query(
        `UPDATE users 
         SET name = $1, email = $2, role = $3 
         WHERE id = $4 RETURNING id, name, email, role`,
        [name, email, role, id]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUserId = (req as any).user?.id;

  if (Number(id) === Number(currentUserId)) {
    return res.status(400).json({ message: 'No puedes eliminarte a ti mismo' });
  }

  try {
    // Verificar si el usuario existe
    const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'Usuario eliminado correctamente', id: Number(id) });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
};

