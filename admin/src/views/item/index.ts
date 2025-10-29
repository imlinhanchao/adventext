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
  ];
  items.forEach((item) => {
    worksheet.addRow({
      key: item.key,
      name: item.name,
      description: item.description,
      attributes: Object.entries(item.attributes)
        .map(([k, v]) => (item.attrName[k] ? `${k}:${v}:${item.attrName[k]}` : `${k}:${v}`))
        .join(';'),
      type: item.type,
    });
  });
  workbook.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
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
        if (!worksheet) {
          ElMessage.error('不是有效的Excel文件，请下载模板后填写数据再导入');
          return;
        }
        // 读取 header（假设第一行为 header）
        const headerRow = worksheet.getRow(1);
        const headers: string[] = [];
        headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const s = cell.value?.toString().trim() || '';
          // 若 header 为空则使用 colIndex 占位，避免键名为 undefined
          headers[colNumber] = s !== '' ? s : `col${colNumber}`;
        });
        const headerNames = ['标识符', '名称', '描述', '类型', '属性', '属性名'];
        const missingHeaders = headerNames.filter((h) => !headers.includes(h));
        if (missingHeaders.length > 0) {
          ElMessage.error(
            `缺少必要的列：${missingHeaders.join(', ')}，请下载最新模板后填写数据再导入`,
          );
          return;
        }
        const result: Record<string, string>[] = [];
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber === 1) return; // 跳过 header
          const obj: Record<string, string> = {};
          // 遍历 header 的列索引，保证列对齐
          for (let col = 1; col <= headers.length; col++) {
            const key = headers[col] || `col${col}`;
            const cell = row.getCell(col);
            obj[key] = cell.value?.toString().trim() || '';
          }
          // 可选：如果整行全为空字符串则跳过
          const allEmpty = Object.values(obj).every((v) => v === '');
          if (!allEmpty) result.push(obj);
        });
        const importedItems: Item[] = [];
        result.forEach((row) => {
          const item: Item = {
            key: row['标识符'],
            name: row['名称'],
            description: row['描述'],
            type: row['类型'],
            attributes: row['属性']
              .split(';')
              .reduce((attrs: Recordable<string | number>, pair) => {
                const [k, v] = pair.split(':');
                if (k && v !== undefined) {
                  attrs[k] = Number(v).toString() === v ? Number(v) : v;
                }
                return attrs;
              }, {}),
            attrName: row['属性名'].split(';').reduce((attrNames: Recordable<string>, pair) => {
              const [k, _, name] = pair.split(':');
              if (k && name) {
                attrNames[k] = name;
              }
              return attrNames;
            }, {}),
          };
          importedItems.push(item);
        });
        resolve(importedItems);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}
