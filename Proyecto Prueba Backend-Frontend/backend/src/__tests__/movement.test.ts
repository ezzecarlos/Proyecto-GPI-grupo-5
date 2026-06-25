import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getMovements, createMovement } from '../controllers/movement.controller';
import { pool } from '../config/db';

vi.mock('../config/db', () => {
  const mockClient = {
    query: vi.fn(),
    release: vi.fn(),
  };
  return {
    pool: {
      query: vi.fn(),
      connect: vi.fn().mockResolvedValue(mockClient),
      on: vi.fn(),
    },
  };
});

describe('Movement Controller', () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockClient: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockClient = await pool.connect();
  });

  describe('getMovements', () => {
    it('should query movements list with dates', async () => {
      mockRequest = {
        query: { startDate: '2026-06-01', endDate: '2026-06-30' }
      };

      (pool.query as any).mockResolvedValueOnce({ rows: [{ id: 1, type: 'Entrada', qty: 10 }] });

      await getMovements(mockRequest, mockResponse);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE m.created_at >= $1 AND m.created_at <= $2'),
        ['2026-06-01', '2026-06-30 23:59:59']
      );
      expect(mockResponse.json).toHaveBeenCalledWith([{ id: 1, type: 'Entrada', qty: 10 }]);
    });
  });

  describe('createMovement', () => {
    it('should create movement successfully and commit transaction', async () => {
      mockRequest = {
        body: { productId: 1, type: 'Entrada', qty: 10, note: 'Compra' },
        user: { name: 'Admin Test' }
      };

      // Mock prodResult query (SELECT stock)
      mockClient.query.mockResolvedValueOnce({}); // BEGIN
      mockClient.query.mockResolvedValueOnce({
        rows: [{ stock: 20, name: 'Polera' }]
      }); // SELECT stock
      mockClient.query.mockResolvedValueOnce({}); // INSERT movement
      mockClient.query.mockResolvedValueOnce({}); // UPDATE product stock
      mockClient.query.mockResolvedValueOnce({}); // COMMIT

      await createMovement(mockRequest, mockResponse);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE products SET stock = $1 WHERE id = $2'),
        [30, 1] // new stock is 20 + 10 = 30
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Movimiento registrado con éxito' });
    });

    it('should rollback transaction if stock is insufficient on Salida', async () => {
      mockRequest = {
        body: { productId: 1, type: 'Salida', qty: 50, note: 'Venta' },
        user: { name: 'Admin Test' }
      };

      mockClient.query.mockResolvedValueOnce({}); // BEGIN
      mockClient.query.mockResolvedValueOnce({
        rows: [{ stock: 20, name: 'Polera' }]
      }); // SELECT stock

      await createMovement(mockRequest, mockResponse);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Stock insuficiente') })
      );
    });
  });
});
