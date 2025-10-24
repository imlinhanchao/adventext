import { Item } from '@/api/item';
import exceljs from 'exceljs';

export function dowloadTemplate(items: Item[] = []) {
  const workbook = new exceljs.Workbook();
  const worksheet = workbook.addWorksheet('Items');
  worksheet.columns = [
    { header: '标识符', key: 'key', width: 30 },
    { header: '名称', key: 'name', width: 30 },
    { header: '描述', key: 'description', width: 50 },
    { header: '类型', key: 'type', width: 15 },
    { header: '属性', key: 'attributes', width: 50 },
    { header: '属性名', key: 'attrName', width: 50 },
  ];
  items.forEach((item) => {
    worksheet.addRow({
      key: item.key,
      name: item.name,
      description: item.description,
      attributes: JSON.stringify(item.attributes),
      type: item.type,
      attrName: JSON.stringify(item.attrName),
    });
  });
  workbook.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'item_template.xlsx';
    link.click();
    URL.revokeObjectURL(link.href);
  });
}

export function importItems(file: File) {
  return new Promise<Item[]>((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const buffer = e.target?.result;
      if (buffer) {
        const workbook = new exceljs.Workbook();
        await workbook.xlsx.load(buffer as ArrayBuffer);
        const worksheet = workbook.getWorksheet('Items');
        const importedItems: Item[] = [];
        worksheet?.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header row
          const item: Item = {
            key: row.getCell('key').value as string,
            name: row.getCell('name').value as string,
            description: row.getCell('description').value as string,
            type: row.getCell('type').value as string,
            attributes: JSON.parse(row.getCell('attributes').value as string || '{}') as any,
            attrName: JSON.parse(row.getCell('attrNames').value as string || '{}') as any,
          };
          importedItems.push(item);
        });
        resolve(importedItems);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}