import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getInventoryReport } from '../controllers/report.controller';
import { pool } from '../config/db';
import puppeteer from 'puppeteer';

vi.mock('../config/db', () => ({
  pool: {
    query: vi.fn(),
    on: vi.fn(),
  },
}));

vi.mock('puppeteer', () => {
  const mockPage = {
    setContent: vi.fn().mockResolvedValue(undefined),
    pdf: vi.fn().mockResolvedValue(Buffer.from('PDF_DUMMY_DATA')),
  };
  const mockBrowser = {
    newPage: vi.fn().mockResolvedValue(mockPage),
    close: vi.fn().mockResolvedValue(undefined),
  };
  return {
    default: {
      launch: vi.fn().mockResolvedValue(mockBrowser),
    },
  };
});

describe('Report Controller', () => {
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest = {};
    mockResponse = {
      setHeader: vi.fn(),
      send: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should generate PDF report successfully and send it', async () => {
    const mockProducts = [
      { id: 1, code: 'P1', name: 'Product 1', brand: 'Brand 1', category: 'Cat 1', stock: 10, minStock: 5 }
    ];

    (pool.query as any).mockResolvedValueOnce({ rows: mockProducts });
    (pool.query as any).mockResolvedValueOnce({ rows: [] });

    await getInventoryReport(mockRequest, mockResponse);

    expect(pool.query).toHaveBeenCalled();
    expect(puppeteer.launch).toHaveBeenCalled();
    expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="reporte-inventario.pdf"');
    expect(mockResponse.send).toHaveBeenCalledWith(Buffer.from('PDF_DUMMY_DATA'));
  });

  it('should return 500 error if database query fails', async () => {
    (pool.query as any).mockRejectedValueOnce(new Error('DB Error'));

    await getInventoryReport(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Error interno del servidor al generar el PDF' });
  });
});
