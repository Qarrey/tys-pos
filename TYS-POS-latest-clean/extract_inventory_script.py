import json
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

p = Path(r'C:/Users/MumTy/Desktop/Inventory Tracker March.xlsx')
z = zipfile.ZipFile(p)
ns = {'a':'http://schemas.openxmlformats.org/spreadsheetml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}

shared = []
if 'xl/sharedStrings.xml' in z.namelist():
    root = ET.fromstring(z.read('xl/sharedStrings.xml'))
    for si in root.findall('a:si', ns):
        texts = []
        for t in si.iterfind('.//a:t', ns):
            texts.append(t.text or '')
        shared.append(''.join(texts))

wb = ET.fromstring(z.read('xl/workbook.xml'))
sheets = wb.find('a:sheets', ns)
rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
relmap = {r.attrib['Id']: r.attrib['Target'] for r in rels}

inventory = []
for sheet in sheets:
    if sheet.attrib.get('name') != 'Inventory':
        continue

    rid = sheet.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
    target = relmap[rid]
    if not target.startswith('http'):
        target = 'xl/' + target.lstrip('/')
    sheet_xml = ET.fromstring(z.read(target))
    rows = []
    for row in sheet_xml.findall('.//a:sheetData/a:row', ns):
        values = []
        for c in row.findall('a:c', ns):
            t = c.attrib.get('t')
            v = c.find('a:v', ns)
            if v is None or v.text is None:
                values.append('')
            else:
                val = v.text
                if t == 's':
                    val = shared[int(val)] if int(val) < len(shared) else val
                values.append(val)
        rows.append(values)

    header_idx = None
    for idx, row in enumerate(rows):
        if any(str(value).strip().lower() == 'item' for value in row):
            header_idx = idx
            break

    if header_idx is None:
        break

    for row in rows[header_idx + 1:]:
        if not any(str(value).strip() for value in row):
            continue
        name = str(row[1]).strip() if len(row) > 1 else ''
        if not name:
            continue
        sku = str(row[2]).strip() if len(row) > 2 else ''
        category = str(row[3]).strip() if len(row) > 3 else 'General'
        initial_stock = str(row[5]).strip() if len(row) > 5 else ''
        on_hand = str(row[6]).strip() if len(row) > 6 else ''
        sales_price = str(row[9]).strip() if len(row) > 9 else ''

        def parse_number(value):
            try:
                return float(str(value).replace(',', '').strip())
            except ValueError:
                return 0

        stock_value = on_hand or initial_stock
        stock = int(parse_number(stock_value)) if stock_value else 0
        price = parse_number(sales_price)

        inventory.append({
            'id': f"p-{len(inventory) + 1}",
            'name': name,
            'price': price,
            'stock': stock,
            'category': category or 'General',
            'sku': sku or f"SKU-{len(inventory) + 1}"
        })

    break

out_path = Path(r'C:/Users/MumTy/Desktop/POS-TYS/index.html/inventory-seed.js')
out_path.write_text('window.inventorySeedData = ' + json.dumps(inventory, indent=2) + ';\n', encoding='utf-8')
print(f'Wrote {len(inventory)} inventory items to {out_path}')
