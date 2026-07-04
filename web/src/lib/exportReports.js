const COLORS = {
  navy: '071634',
  blue: '168FE3',
  yellow: 'FFC20A',
  light: 'EEF0F4',
  white: 'FFFFFF',
};

const safeFileName = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9-_]/g, '-')
  .replace(/-+/g, '-');

async function getLogo() {
  const response = await fetch('/logo.jpg');
  if (!response.ok) throw new Error('No se pudo cargar el logo de BusWay');
  return response.arrayBuffer();
}

function downloadBlob(data, type, name) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function exportToPdf({ title, columns, rows, fileName = 'reporte-busway' }) {
  const [{ jsPDF }, { default: autoTable }, logoBuffer] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    getLogo(),
  ]);
  const logoBase64 = btoa(new Uint8Array(logoBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
  const doc = new jsPDF({ orientation: columns.length > 5 ? 'landscape' : 'portrait' });
  const width = doc.internal.pageSize.getWidth();

  doc.setFillColor(7, 22, 52);
  doc.rect(0, 0, width, 31, 'F');
  doc.addImage(`data:image/jpeg;base64,${logoBase64}`, 'JPEG', 12, 5, 21, 21);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('BusWay', 39, 14);
  doc.setTextColor(255, 194, 10);
  doc.setFontSize(9);
  doc.text('Tus hijos seguros en cada ruta', 39, 21);
  doc.setTextColor(7, 22, 52);
  doc.setFontSize(16);
  doc.text(title, 12, 43);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleString('es-PA')}`, 12, 49);

  autoTable(doc, {
    startY: 56,
    head: [columns],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [255, 194, 10], textColor: [7, 22, 52], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [238, 240, 244] },
    styles: { fontSize: 8, cellPadding: 3, lineColor: [220, 225, 232] },
    didDrawPage: ({ pageNumber }) => {
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`BusWay · Página ${pageNumber}`, width - 12, pageHeight - 7, { align: 'right' });
    },
  });

  doc.save(`${safeFileName(fileName)}.pdf`);
}

export async function exportToExcel({ title, columns, rows, fileName = 'reporte-busway' }) {
  const [{ default: ExcelJS }, logoBuffer] = await Promise.all([import('exceljs'), getLogo()]);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BusWay';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet('Reporte', {
    views: [{ state: 'frozen', ySplit: 5, showGridLines: false }],
  });

  const logoId = workbook.addImage({ buffer: logoBuffer, extension: 'jpeg' });
  sheet.addImage(logoId, { tl: { col: 0.15, row: 0.15 }, ext: { width: 58, height: 58 } });
  sheet.mergeCells(1, 2, 2, Math.max(columns.length, 2));
  const brand = sheet.getCell('B1');
  brand.value = 'BusWay';
  brand.font = { bold: true, size: 24, color: { argb: COLORS.white } };
  brand.alignment = { vertical: 'middle' };
  sheet.mergeCells(3, 1, 3, Math.max(columns.length, 2));
  sheet.getCell('A3').value = title;
  sheet.getCell('A3').font = { bold: true, size: 16, color: { argb: COLORS.navy } };
  sheet.mergeCells(4, 1, 4, Math.max(columns.length, 2));
  sheet.getCell('A4').value = `Generado: ${new Date().toLocaleString('es-PA')}`;
  sheet.getCell('A4').font = { italic: true, size: 9, color: { argb: '64748B' } };

  for (let row = 1; row <= 2; row += 1) {
    for (let col = 1; col <= Math.max(columns.length, 2); col += 1) {
      sheet.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navy } };
    }
  }
  sheet.getRow(1).height = 30;
  sheet.getRow(2).height = 30;

  const header = sheet.addRow(columns);
  header.height = 24;
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: COLORS.navy } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.yellow } };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = { bottom: { style: 'thin', color: { argb: COLORS.blue } } };
  });

  rows.forEach((values, index) => {
    const row = sheet.addRow(values);
    if (index % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.light } };
      });
    }
  });
  columns.forEach((column, index) => {
    const maxLength = Math.max(String(column).length, ...rows.map((row) => String(row[index] ?? '').length));
    sheet.getColumn(index + 1).width = Math.min(Math.max(maxLength + 3, 14), 36);
  });
  sheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: columns.length } };

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(buffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', `${safeFileName(fileName)}.xlsx`);
}
