import { vi, describe, it, expect, beforeEach } from 'vitest';
import { updateProfile } from '../controllers/auth.controller';
import { pool } from '../config/db';
import bcrypt from 'bcryptjs';

vi.mock('../config/db', () => ({
  pool: {
    query: vi.fn(),
    on: vi.fn(),
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    genSalt: vi.fn().mockResolvedValue('salt'),
    hash: vi.fn().mockResolvedValue('hashed_password'),
  },
}));

describe('Auth Controller - Update Profile', () => {
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest = {
      user: {
        id: 1,
        email: 'user@example.com',
      },
      body: {
        name: 'New Name',
        password: '',
      },
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should update user name successfully', async () => {
    const mockUser = {
      id: 1,
      name: 'New Name',
      email: 'user@example.com',
      role: 'VENDEDOR',
    };

    (pool.query as any).mockResolvedValueOnce({ rows: [mockUser] });

    await updateProfile(mockRequest, mockResponse);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE users SET name = $1 WHERE id = $2'),
      ['New Name', 1]
    );
    expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
  });

  it('should update name and password successfully when password is provided', async () => {
    mockRequest.body.password = 'newpassword123';
    const mockUser = {
      id: 1,
      name: 'New Name',
      email: 'user@example.com',
      role: 'VENDEDOR',
    };

    (pool.query as any).mockResolvedValueOnce({ rows: [mockUser] });

    await updateProfile(mockRequest, mockResponse);

    expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
    expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 'salt');
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE users SET name = $1, password = $2 WHERE id = $3'),
      ['New Name', 'hashed_password', 1]
    );
    expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
  });

  it('should return 400 if name is empty', async () => {
    mockRequest.body.name = '';

    await updateProfile(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'El nombre es obligatorio' });
  });

  it('should return 404 if user does not exist', async () => {
    (pool.query as any).mockResolvedValueOnce({ rows: [] });

    await updateProfile(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Usuario no encontrado' });
  });

  it('should return 500 if database query fails', async () => {
    (pool.query as any).mockRejectedValueOnce(new Error('DB Error'));

    await updateProfile(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error al actualizar perfil' });
  });
});
