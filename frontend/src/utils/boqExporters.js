import { formatCurrency } from './formatters';

function getExportDate() {
  return new Date().toISOString().slice(0, 10);
}

function getTotal(items) {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

function toPdfText(value) {
  return String(value)
    .replaceAll('²', '^2')
    .replaceAll('³', '^3')
    .replaceAll('×', 'x')
    .replaceAll('–', '-')
    .replaceAll('—', '-');
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function xmlCell(value, type = 'String', style = '') {
  return `<Cell${style ? ` ss:StyleID="${style}"` : ''}><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>`;
}

function downloadFile(content, mimeType, filename) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function exportBoqPdf(items, drawing) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const total = getTotal(items);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFontSize(18);
  doc.text('DaiBoq - Bill of Quantities', 14, 16);
  doc.setFontSize(10);
  doc.text(`Currency: LKR | Exported: ${getExportDate()}`, 14, 23);
  doc.text(`Source drawing: ${toPdfText(drawing?.fileName || 'Not specified')}`, 14, 28);

  autoTable(doc, {
    startY: 34,
    head: [['#', 'Category', 'Description', 'Qty', 'Unit', 'Rate (LKR)', 'Amount (LKR)']],
    body: items.map((item, index) => [
      index + 1,
      toPdfText(item.category),
      toPdfText(item.description),
      item.quantity,
      toPdfText(item.unit),
      formatCurrency(item.rate),
      formatCurrency(item.amount),
    ]),
    foot: [['', '', '', '', '', 'Grand Total', formatCurrency(total)]],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [14, 165, 233] },
    footStyles: { fillColor: [15, 28, 48], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 10 },
      2: { cellWidth: 90 },
      3: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
    },
  });

  doc.save(`boq-${getExportDate()}.pdf`);
}

export function exportBoqExcel(items, drawing) {
  const header = ['#', 'Category', 'Description', 'Quantity', 'Unit', 'Rate (LKR)', 'Amount (LKR)']
    .map((value) => xmlCell(value, 'String', 'Header'))
    .join('');
  const rows = items.map((item, index) => `
    <Row>
      ${xmlCell(index + 1, 'Number')}
      ${xmlCell(item.category)}
      ${xmlCell(item.description)}
      ${xmlCell(item.quantity, 'Number')}
      ${xmlCell(item.unit)}
      ${xmlCell(item.rate, 'Number', 'Currency')}
      ${xmlCell(item.amount, 'Number', 'Currency')}
    </Row>`).join('');
  const workbook = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#0EA5E9" ss:Pattern="Solid"/></Style>
    <Style ss:ID="Currency"><NumberFormat ss:Format="&quot;LKR&quot; #,##0.00"/></Style>
    <Style ss:ID="Total"><Font ss:Bold="1"/><NumberFormat ss:Format="&quot;LKR&quot; #,##0.00"/></Style>
  </Styles>
  <Worksheet ss:Name="BOQ">
    <Table>
      <Column ss:Width="35"/><Column ss:Width="100"/><Column ss:Width="280"/>
      <Column ss:Width="70"/><Column ss:Width="60"/><Column ss:Width="100"/><Column ss:Width="115"/>
      <Row><Cell><Data ss:Type="String">Source drawing</Data></Cell><Cell><Data ss:Type="String">${escapeXml(drawing?.fileName || 'Not specified')}</Data></Cell></Row>
      <Row/>
      <Row>${header}</Row>
      ${rows}
      <Row>
        <Cell ss:Index="6"><Data ss:Type="String">Grand Total</Data></Cell>
        ${xmlCell(getTotal(items), 'Number', 'Total')}
      </Row>
    </Table>
  </Worksheet>
</Workbook>`;

  downloadFile(workbook, 'application/vnd.ms-excel;charset=utf-8', `boq-${getExportDate()}.xls`);
}
