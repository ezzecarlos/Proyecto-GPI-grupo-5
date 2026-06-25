import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/user.controller';
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

describe('User Controller', () => {
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  describe('getUsers', () => {
    it('should return all users list', async () => {
      const mockUsers = [
        { id: 1, name: 'Admin', email: 'admin@test.com', role: 'ADMINISTRADOR' },
        { id: 2, name: 'Bodeguero', email: 'bod@test.com', role: 'BODEGUERO' }
      ];
      (pool.query as any).mockResolvedValueOnce({ rows: mockUsers });

      await getUsers(mockRequest, mockResponse);

      expect(pool.query).toHaveBeenCalledWith('SELECT id, name, email, role FROM users ORDER BY id ASC');
      expect(mockResponse.json).toHaveBeenCalledWith(mockUsers);
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      mockRequest = {
        body: {
          name: 'New User',
          email: 'new@test.com',
          password: 'password123',
          role: 'VENDEDOR'
        }
      };

      // Email existsResult: empty
      (pool.query as any).mockResolvedValueOnce({ rows: [] });
      // Insert result
      (pool.query as any).mockResolvedValueOnce({
        rows: [{ id: 4, name: 'New User', email: 'new@test.com', role: 'VENDEDOR' }]
      });

      await createUser(mockRequest, mockResponse);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt');
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({ id: 4, name: 'New User', email: 'new@test.com', role: 'VENDEDOR' });
    });

    it('should return 400 if email is already registered', async () => {
      mockRequest = {
        body: {
          name: 'New User',
          email: 'new@test.com',
          password: 'password123',
          role: 'VENDEDOR'
        }
      };

      (pool.query as any).mockResolvedValueOnce({ rows: [{ id: 2 }] });

      await createUser(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'El correo electrónico ya está registrado' });
    });
  });

  describe('updateUser', () => {
    it('should update user successfully without changing password', async () => {
      mockRequest = {
        params: { id: '2' },
        body: {
          name: 'Updated Name',
          email: 'newemail@test.com',
          role: 'BODEGUERO',
          password: ''
        }
      };

      // User existsResult
      (pool.query as any).mockResolvedValueOnce({ rows: [{ id: 2 }] });
      // Email uniqueness check (other than ID 2)
      (pool.query as any).mockResolvedValueOnce({ rows: [] });
      // Update result
      (pool.query as any).mockResolvedValueOnce({
        rows: [{ id: 2, name: 'Updated Name', email: 'newemail@test.com', role: 'BODEGUERO' }]
      });

      await updateUser(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({ id: 2, name: 'Updated Name', email: 'newemail@test.com', role: 'BODEGUERO' });
    });

    it('should update user successfully and hash new password if provided', async () => {
      mockRequest = {
        params: { id: '2' },
        body: {
          name: 'Updated Name',
          email: 'newemail@test.com',
          role: 'BODEGUERO',
          password: 'newpassword123'
        }
      };

      // User existsResult
      (pool.query as any).mockResolvedValueOnce({ rows: [{ id: 2 }] });
      // Email uniqueness check
      (pool.query as any).mockResolvedValueOnce({ rows: [] });
      // Update result
      (pool.query as any).mockResolvedValueOnce({
        rows: [{ id: 2, name: 'Updated Name', email: 'newemail@test.com', role: 'BODEGUERO' }]
      });

      await updateUser(mockRequest, mockResponse);

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 'salt');
      expect(mockResponse.json).toHaveBeenCalledWith({ id: 2, name: 'Updated Name', email: 'newemail@test.com', role: 'BODEGUERO' });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockRequest = {
        params: { id: '3' },
        user: { id: 1 } // Logged in user is ID 1
      };

      // User exists check
      (pool.query as any).mockResolvedValueOnce({ rows: [{ id: 3 }] });
      // Delete operation
      (pool.query as any).mockResolvedValueOnce({});

      await deleteUser(mockRequest, mockResponse);

      expect(pool.query).toHaveBeenCalledWith('DELETE FROM users WHERE id = $1', ['3']);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Usuario eliminado correctamente', id: 3 });
    });

    it('should return 400 if user tries to delete themselves', async () => {
      mockRequest = {
        params: { id: '1' },
        user: { id: 1 } // Logged in user is ID 1
      };

      await deleteUser(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'No puedes eliminarte a ti mismo' });
    });
  });
});
