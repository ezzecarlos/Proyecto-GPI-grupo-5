import { vi, describe, it, expect, beforeEach } from 'vitest';
import { login } from '../controllers/auth.controller';
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
    compare: vi.fn(),
  },
}));

describe('Auth Controller - Login', () => {
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest = {
      body: {
        email: 'admin@inventario.cl',
        password: 'admin123',
      },
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should login successfully with valid credentials', async () => {
    const mockUser = {
      id: 1,
      name: 'Administrador',
      email: 'admin@inventario.cl',
      password: 'hashed_password',
      role: 'ADMINISTRADOR',
    };

    // Mock DB query to return user
    (pool.query as any).mockResolvedValueOnce({ rows: [mockUser] });
    // Mock bcrypt compare to return true
    (bcrypt.compare as any).mockResolvedValueOnce(true);

    await login(mockRequest, mockResponse);

    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE email = $1', ['admin@inventario.cl']);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        token: expect.any(String),
        user: {
          id: 1,
          name: 'Administrador',
          email: 'admin@inventario.cl',
          role: 'ADMINISTRADOR',
        },
      })
    );
  });

  it('should return 401 if user does not exist', async () => {
    // Mock DB query to return no rows
    (pool.query as any).mockResolvedValueOnce({ rows: [] });

    await login(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Credenciales inválidas' });
  });

  it('should return 401 if password does not match', async () => {
    const mockUser = {
      id: 1,
      name: 'Administrador',
      email: 'admin@inventario.cl',
      password: 'hashed_password',
      role: 'ADMINISTRADOR',
    };

    (pool.query as any).mockResolvedValueOnce({ rows: [mockUser] });
    (bcrypt.compare as any).mockResolvedValueOnce(false);
    mockRequest.body.password = 'wrong_password';

    await login(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Credenciales inválidas' });
  });
});
