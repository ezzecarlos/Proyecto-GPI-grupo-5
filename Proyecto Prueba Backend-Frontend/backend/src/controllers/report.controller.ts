import { Request, Response } from 'express';
import puppeteer from 'puppeteer';
import { pool } from '../config/db';

// Helper function to generate SVG Bar Chart for monthly movements
function getBarChartSvg(data: { mes: string; entradas: number; salidas: number }[]) {
  const maxVal = Math.max(...data.map(d => Math.max(d.entradas, d.salidas)), 10);
  const yMax = Math.ceil(maxVal / 10) * 10;
  
  const width = 450;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  let gridLines = '';
  for (let i = 0; i <= 4; i++) {
    const yVal = Math.round((yMax / 4) * i);
    const yPos = height - padding.bottom - (chartHeight / 4) * i;
    gridLines += `
      <line x1="${padding.left}" y1="${yPos}" x2="${width - padding.right}" y2="${yPos}" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="3 3" />
      <text x="${padding.left - 10}" y="${yPos + 4}" font-size="10" font-family="'Helvetica Neue', Arial" fill="#94A3B8" text-anchor="end">${yVal}</text>
    `;
  }
  
  const barSpacing = chartWidth / data.length;
  const barWidth = 14;
  let bars = '';
  let labels = '';
  
  data.forEach((d, idx) => {
    const xPos = padding.left + barSpacing * idx + (barSpacing - barWidth * 2 - 4) / 2;
    
    // Entradas (Blue)
    const hEntrada = (d.entradas / yMax) * chartHeight;
    const yEntrada = height - padding.bottom - hEntrada;
    bars += `<rect x="${xPos}" y="${yEntrada}" width="${barWidth}" height="${hEntrada}" fill="#2563EB" rx="2" />`;
    
    // Salidas (Red)
    const hSalida = (d.salidas / yMax) * chartHeight;
    const ySalida = height - padding.bottom - hSalida;
    bars += `<rect x="${xPos + barWidth + 4}" y="${ySalida}" width="${barWidth}" height="${hSalida}" fill="#EF4444" rx="2" />`;
    
    labels += `<text x="${padding.left + barSpacing * idx + barSpacing / 2}" y="${height - 10}" font-size="10" font-family="'Helvetica Neue', Arial" fill="#94A3B8" text-anchor="middle">${d.mes}</text>`;
  });
  
  return `
    <svg width="100%" height="200" viewBox="0 0 ${width} ${height}">
      ${gridLines}
      ${bars}
      ${labels}
    </svg>
  `;
}

// Helper function to generate SVG Donut Chart for stock by category
function getPieChartSvg(data: { name: string; value: number; color: string }[]) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return `
      <svg width="100%" height="150" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="70" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="2" />
        <text x="100" y="105" font-size="12" font-family="'Helvetica Neue', Arial" fill="#94A3B8" text-anchor="middle">Sin stock</text>
      </svg>
    `;
  }
  
  let accumulatedAngle = 0;
  let paths = '';
  
  data.forEach(item => {
    const angle = (item.value / total) * 360;
    if (angle === 360) {
      paths = `<circle cx="100" cy="100" r="75" fill="${item.color}" />`;
      return;
    }
    
    const x1 = 100 + 75 * Math.cos((accumulatedAngle - 90) * Math.PI / 180);
    const y1 = 100 + 75 * Math.sin((accumulatedAngle - 90) * Math.PI / 180);
    
    accumulatedAngle += angle;
    
    const x2 = 100 + 75 * Math.cos((accumulatedAngle - 90) * Math.PI / 180);
    const y2 = 100 + 75 * Math.sin((accumulatedAngle - 90) * Math.PI / 180);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    paths += `<path d="M 100 100 L ${x1} ${y1} A 75 75 0 ${largeArcFlag} 1 ${x2} ${y2} Z" fill="${item.color}" stroke="#ffffff" stroke-width="1.5" />`;
  });
  
  const donutHole = `<circle cx="100" cy="100" r="40" fill="#ffffff" />`;
  
  return `
    <svg width="100%" height="150" viewBox="0 0 200 200">
      ${paths}
      ${donutHole}
    </svg>
  `;
}

export const getInventoryReport = async (req: Request, res: Response) => {
  try {
    // 1. Obtener datos de los productos activos desde PostgreSQL
    const prodResult = await pool.query(
      `SELECT id, code, name, brand, category, stock, "minStock" 
       FROM products 
       WHERE active = true 
       ORDER BY category ASC, name ASC`
    );
    const products = prodResult.rows;

    // 2. Obtener movimientos desde PostgreSQL
    const movResult = await pool.query(
      `SELECT id, "productId", type, qty, created_at 
       FROM movements 
       ORDER BY created_at DESC`
    );
    const movements = movResult.rows;

    // 3. Formatear la fecha actual para el reporte
    const today = new Date();
    const formattedDate = today.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // 4. Calcular KPIs
    const totalProducts = products.length;
    const lowStockCount = products.filter(p => p.stock < p.minStock && p.stock > 0).length;
    const outOfStockCount = products.filter(p => p.stock === 0).length;

    const currentMonthIndex = today.getMonth();
    const currentMonthYear = today.getFullYear();
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const currentMonthName = monthNames[currentMonthIndex];

    const movementsThisMonth = movements.filter(m => {
      const d = new Date(m.created_at);
      return d.getFullYear() === currentMonthYear && d.getMonth() === currentMonthIndex;
    }).length;

    // 5. Calcular Stock por Categoría (para gráfico circular)
    const categoriesMap: Record<string, number> = {};
    products.forEach(p => {
      const cat = p.category || "Sin Categoría";
      categoriesMap[cat] = (categoriesMap[cat] || 0) + (p.stock || 0);
    });

    const colors = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"];
    const stockByCat = Object.keys(categoriesMap).map((cat, idx) => ({
      name: cat,
      value: categoriesMap[cat],
      color: colors[idx % colors.length]
    }));

    // 6. Calcular Movimientos Mensuales (últimos 5 meses)
    const monthsShort = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const last5Months: any[] = [];
    for (let i = 4; i >= 0; i--) {
      const targetDate = new Date(currentMonthYear, currentMonthIndex - i, 1);
      last5Months.push({
        year: targetDate.getFullYear(),
        month: targetDate.getMonth(),
        name: monthsShort[targetDate.getMonth()],
        entradas: 0,
        salidas: 0
      });
    }

    movements.forEach(m => {
      const mDate = new Date(m.created_at);
      const mYear = mDate.getFullYear();
      const mMonth = mDate.getMonth();

      const bucket = last5Months.find(b => b.year === mYear && b.month === mMonth);
      if (bucket) {
        if (m.type === "Entrada") {
          bucket.entradas += m.qty;
        } else if (m.type === "Salida") {
          bucket.salidas += m.qty;
        }
      }
    });

    const movByMonth = last5Months.map(b => ({
      mes: b.name,
      entradas: b.entradas,
      salidas: b.salidas
    }));

    // Generar SVGs de gráficos
    const barChartSvg = getBarChartSvg(movByMonth);
    const pieChartSvg = getPieChartSvg(stockByCat);

    // Listado de leyendas del gráfico circular
    const pieLegendHtml = stockByCat.map(cat => `
      <div class="legend-item">
        <span class="legend-color-dot" style="background-color: ${cat.color}"></span>
        <span class="legend-text">${cat.name}: <strong>${cat.value} u.</strong></span>
      </div>
    `).join('');

    // Listado de filas de productos
    const rowsHtml = products.map(p => {
      let statusBadge = '<span class="badge badge-normal">Disponible</span>';
      if (p.stock === 0) {
        statusBadge = '<span class="badge badge-out">Sin Stock</span>';
      } else if (p.stock < p.minStock) {
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
            margin-bottom: 20px;
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
          
          /* KPI Cards */
          .kpi-container {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
          }
          .kpi-card {
            flex: 1;
            background-color: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 12px;
            text-align: center;
          }
          .kpi-val {
            font-size: 20px;
            font-weight: 700;
            color: #1E293B;
            margin-bottom: 2px;
          }
          .kpi-lbl {
            font-size: 10px;
            color: #64748B;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          
          /* Charts Layout */
          .charts-container {
            display: flex;
            gap: 20px;
            margin-bottom: 25px;
          }
          .chart-box {
            flex: 1;
            border: 1px solid #F1F5F9;
            background-color: #FFFFFF;
            border-radius: 10px;
            padding: 15px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          }
          .chart-title {
            font-size: 13px;
            font-weight: 700;
            color: #1E293B;
            margin: 0 0 4px 0;
          }
          .chart-desc {
            font-size: 10px;
            color: #94A3B8;
            margin: 0 0 12px 0;
          }
          
          .pie-chart-layout {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .pie-legend {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 10.5px;
            color: #475569;
          }
          .legend-color-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
          }
          
          /* Table Styles */
          .table-title {
            font-size: 14px;
            font-weight: 700;
            color: #1E293B;
            margin: 25px 0 10px 0;
            border-bottom: 1px solid #E2E8F0;
            padding-bottom: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 5px;
          }
          th {
            background-color: #F8FAFC;
            color: #475569;
            font-weight: 700;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            text-align: left;
            padding: 8px 10px;
            border-bottom: 2px solid #E2E8F0;
          }
          td {
            padding: 8px 10px;
            font-size: 11px;
            border-bottom: 1px solid #F1F5F9;
            color: #334155;
            vertical-align: middle;
          }
          tr {
            page-break-inside: avoid;
          }
          code {
            font-family: monospace;
            background-color: #F1F5F9;
            color: #475569;
            padding: 2px 4px;
            border-radius: 4px;
            font-size: 10px;
          }
          .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 9999px;
            font-size: 9px;
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
            margin: 15mm;
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="header-left">
            <h1 class="title">StockSmart</h1>
            <p class="subtitle">Reporte Ejecutivo de Inventario, Movimientos y Stock</p>
          </div>
          <div class="header-right">
            Generado: ${formattedDate}<br>
            Base de Datos: PostgreSQL (Neon)<br>
            Estado: Oficial
          </div>
        </div>

        <!-- KPIs Grid -->
        <div class="kpi-container">
          <div class="kpi-card" style="border-left: 4px solid #2563EB;">
            <div class="kpi-val">${totalProducts}</div>
            <div class="kpi-lbl">Total Productos</div>
          </div>
          <div class="kpi-card" style="border-left: 4px solid #D97706;">
            <div class="kpi-val">${lowStockCount}</div>
            <div class="kpi-lbl">Stock Bajo</div>
          </div>
          <div class="kpi-card" style="border-left: 4px solid #DC2626;">
            <div class="kpi-val">${outOfStockCount}</div>
            <div class="kpi-lbl">Sin Stock</div>
          </div>
          <div class="kpi-card" style="border-left: 4px solid #8B5CF6;">
            <div class="kpi-val">${movementsThisMonth}</div>
            <div class="kpi-lbl">Movimientos (${currentMonthName})</div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="charts-container">
          <!-- Monthly Movements Bar Chart -->
          <div class="chart-box">
            <h3 class="chart-title">Movimientos por mes</h3>
            <p class="chart-desc">Entradas (azul) vs Salidas (rojo) en los últimos 5 meses</p>
            ${barChartSvg}
          </div>
          
          <!-- Stock by Category Doughnut Chart -->
          <div class="chart-box">
            <h3 class="chart-title">Stock por categoría</h3>
            <p class="chart-desc">Distribución total de unidades de productos activos</p>
            <div class="pie-chart-layout">
              <div style="flex: 0 0 120px;">
                ${pieChartSvg}
              </div>
              <div class="pie-legend">
                ${pieLegendHtml}
              </div>
            </div>
          </div>
        </div>

        <h3 class="table-title">Detalle de Inventario Completo</h3>
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
          Documento confidencial para uso interno de StockSmart. Generado dinámicamente mediante Puppeteer PDF Engine.
        </div>
      </body>
      </html>
    `;

    // 7. Iniciar Puppeteer en segundo plano para renderizar el PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    await page.setContent(htmlContent, { waitUntil: 'load' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        bottom: '15mm',
        left: '15mm',
        right: '15mm'
      }
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte-inventario.pdf"');
    res.send(Buffer.from(pdfBuffer));

  } catch (error) {
    console.error('Error al generar reporte PDF:', error);
    res.status(500).json({ message: 'Error interno del servidor al generar el PDF' });
  }
};


