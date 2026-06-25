import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getProducts, createProduct, updateProduct, deleteProduct, getPredictiveAlerts } from '../controllers/product.controller';
import { pool } from '../config/db';

vi.mock('../config/db', () => ({
  pool: {
    query: vi.fn(),
    on: vi.fn(),
  },
}));

describe('Product Controller', () => {
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  describe('getProducts', () => {
    it('should return products with calculated status', async () => {
      const mockRows = [
        { id: 1, code: 'P1', name: 'Prod 1', stock: 10, minStock: 5 },
        { id: 2, code: 'P2', name: 'Prod 2', stock: 2, minStock: 5 },
        { id: 3, code: 'P3', name: 'Prod 3', stock: 0, minStock: 2 }
      ];

      (pool.query as any).mockResolvedValueOnce({ rows: mockRows });

      await getProducts(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith([
        { id: 1, code: 'P1', name: 'Prod 1', stock: 10, minStock: 5, status: 'Disponible' },
        { id: 2, code: 'P2', name: 'Prod 2', stock: 2, minStock: 5, status: 'Stock bajo' },
        { id: 3, code: 'P3', name: 'Prod 3', stock: 0, minStock: 2, status: 'Sin stock' }
      ]);
    });
  });

  describe('createProduct', () => {
    it('should create product', async () => {
      mockRequest = {
        body: { code: 'P4', name: 'Prod 4', brand: 'B', category: 'C', stock: 10, minStock: 2 }
      };

      (pool.query as any).mockResolvedValueOnce({
        rows: [{ id: 4, code: 'P4', name: 'Prod 4', brand: 'B', category: 'C', stock: 10, minStock: 2 }]
      });

      await createProduct(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        id: 4, code: 'P4', name: 'Prod 4', brand: 'B', category: 'C', stock: 10, minStock: 2, status: 'Disponible'
      });
    });
  });

  describe('updateProduct', () => {
    it('should update product details', async () => {
      mockRequest = {
        params: { id: '1' },
        body: { name: 'New Name', brand: 'New Brand', category: 'New Cat', minStock: 3 }
      };

      (pool.query as any).mockResolvedValueOnce({
        rows: [{ id: 1, code: 'P1', name: 'New Name', brand: 'New Brand', category: 'New Cat', minStock: 3 }]
      });

      await updateProduct(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        id: 1, code: 'P1', name: 'New Name', brand: 'New Brand', category: 'New Cat', minStock: 3
      });
    });
  });

  describe('deleteProduct', () => {
    it('should deactivate product (soft delete)', async () => {
      mockRequest = { params: { id: '1' } };

      (pool.query as any).mockResolvedValueOnce({});

      await deleteProduct(mockRequest, mockResponse);

      expect(pool.query).toHaveBeenCalledWith('UPDATE products SET active = false WHERE id = $1', ['1']);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Producto desactivado' });
    });
  });

  describe('getPredictiveAlerts', () => {
    it('should return predictive alerts based on velocity', async () => {
      // Mock movements query for sales velocity in last 30 days
      // Product 1 sold 30 units in 30 days -> velocity = 1.0/day
      // Product 2 sold 0 units -> velocity = 0
      (pool.query as any).mockResolvedValueOnce({
        rows: [
          { productId: 1, totalSold: 30 }
        ]
      });

      // Mock products list
      (pool.query as any).mockResolvedValueOnce({
        rows: [
          { id: 1, code: 'P1', name: 'Prod 1', brand: 'B', category: 'C', stock: 5, minStock: 5 },
          { id: 2, code: 'P2', name: 'Prod 2', brand: 'B', category: 'C', stock: 0, minStock: 5 }
        ]
      });

      await getPredictiveAlerts(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            daysLeft: 5, // 5 stock / 1.0 velocity
          }),
          expect.objectContaining({
            id: 2,
            daysLeft: 0, // stock = 0 -> daysLeft = 0
          })
        ])
      );
    });
  });
});
