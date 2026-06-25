"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInventoryReport = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const db_1 = require("../config/db");
const getInventoryReport = async (req, res) => {
    try {
        // 1. Obtener datos de los productos activos desde PostgreSQL
        const result = await db_1.pool.query(`SELECT id, code, name, brand, category, stock, "minStock" 
       FROM products 
       WHERE active = true 
       ORDER BY category ASC, name ASC`);
        const products = result.rows;
        // 2. Formatear la fecha actual para el reporte
        const today = new Date();
        const formattedDate = today.toLocaleDateString('es-CL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        // 3. Crear el contenido HTML con estilos de impresión optimizados
        const rowsHtml = products.map(p => {
            let statusBadge = '<span class="badge badge-normal">Disponible</span>';
            if (p.stock === 0) {
                statusBadge = '<span class="badge badge-out">Sin Stock</span>';
            }
            else if (p.stock < p.minStock) {
                statusBadge = '<span class="badge badge-low">Stock Bajo</span>';
            }
            return `
        <tr>
          <td><code>${p.code}</code></td>
          <td><strong>${p.name}</strong><br><small style="color:#9CA3AF">${p.brand || 'Sin marca'}</small></td>
          <td><span style="background-color:#F3F4F6; padding:2px 6px; border-radius:4px; font-size:11px;">${p.category}</span></td>
          <td class="stock-qty" style="color: ${p.stock === 0 ? '#DC2626' : p.stock < p.minStock ? '#D97706' : '#111827'}">${p.stock}</td>
          <td style="color:#6B7280">${p.minStock}</td>
          <td>${statusBadge}</td>
        </tr>
      `;
        }).join('');
        const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reporte de Inventario - StockSmart</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #374151;
            margin: 0;
            padding: 0;
            line-height: 1.4;
          }
          .header-container {
            border-bottom: 3px solid #2563EB;
            padding-bottom: 12px;
            margin-bottom: 25px;
            display: block;
            position: relative;
          }
          .header-left {
            display: inline-block;
            width: 60%;
          }
          .header-right {
            display: inline-block;
            width: 38%;
            text-align: right;
            vertical-align: bottom;
            font-size: 11px;
            color: #6B7280;
          }
          .title {
            font-size: 26px;
            font-weight: 800;
            color: #1E3A8A;
            margin: 0;
            letter-spacing: -0.02em;
          }
          .subtitle {
            font-size: 12px;
            color: #4B5563;
            margin: 4px 0 0 0;
            font-weight: 500;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th {
            background-color: #F8FAFC;
            color: #475569;
            font-weight: 700;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            text-align: left;
            padding: 10px 12px;
            border-bottom: 2px solid #E2E8F0;
          }
          td {
            padding: 10px 12px;
            font-size: 11.5px;
            border-bottom: 1px solid #F1F5F9;
            color: #334155;
            vertical-align: middle;
          }
          tr {
            page-break-inside: avoid; /* Evita que las filas se corten a la mitad */
          }
          code {
            font-family: monospace;
            background-color: #F1F5F9;
            color: #475569;
            padding: 2px 4px;
            border-radius: 4px;
            font-size: 10.5px;
          }
          .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 9999px;
            font-size: 9.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.02em;
            border: 1px solid transparent;
          }
          .badge-normal {
            background-color: #ECFDF5;
            color: #065F46;
            border-color: #A7F3D0;
          }
          .badge-low {
            background-color: #FFFBEB;
            color: #92400E;
            border-color: #FDE68A;
          }
          .badge-out {
            background-color: #FEF2F2;
            color: #991B1B;
            border-color: #FCA5A5;
          }
          .stock-qty {
            font-weight: 700;
          }
          .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 9px;
            color: #94A3B8;
            border-top: 1px solid #E2E8F0;
            padding-top: 8px;
          }
          @page {
            size: A4;
            margin: 20mm;
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="header-left">
            <h1 class="title">StockSmart</h1>
            <p class="subtitle">Reporte Oficial de Inventario y Stock</p>
          </div>
          <div class="header-right">
            Generado: ${formattedDate}<br>
            Base de Datos: PostgreSQL (Neon)<br>
            Estado: Oficial
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 15%">Código</th>
              <th style="width: 35%">Producto</th>
              <th style="width: 15%">Categoría</th>
              <th style="width: 12%">Stock Act.</th>
              <th style="width: 12%">Stock Mín.</th>
              <th style="width: 11%">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          Documento confidencial para uso interno de StockSmart. Generado dinámicamente mediante Puppeteer PDF Engine. Página 1 de 1
        </div>
      </body>
      </html>
    `;
        // 4. Iniciar Puppeteer en segundo plano para renderizar el PDF
        const browser = await puppeteer_1.default.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        // Cargar la plantilla HTML
        await page.setContent(htmlContent, { waitUntil: 'load' });
        // Generar el buffer binario del PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                bottom: '20mm',
                left: '20mm',
                right: '20mm'
            }
        });
        await browser.close();
        // 5. Enviar el flujo binario con las cabeceras HTTP correctas
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="reporte-inventario.pdf"');
        res.send(pdfBuffer);
    }
    catch (error) {
        console.error('Error al generar reporte PDF:', error);
        res.status(500).json({ message: 'Error interno del servidor al generar el PDF' });
    }
};
exports.getInventoryReport = getInventoryReport;
