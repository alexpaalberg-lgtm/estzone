import type { InsertProduct } from '@shared/schema';

export function parseCSV(csvContent: string): InsertProduct[] {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const products: InsertProduct[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const product: any = {};
    
    headers.forEach((header, index) => {
      const value = values[index];
      
      switch (header) {
        case 'sku':
        case 'nameEn':
        case 'nameEt':
        case 'descriptionEn':
        case 'descriptionEt':
        case 'categoryId':
        case 'metaKeywords':
          product[header] = value;
          break;
        case 'price':
        case 'salePrice':
          product[header] = value ? parseFloat(value) : undefined;
          break;
        case 'stock':
        case 'lowStockThreshold':
          product[header] = value ? parseInt(value, 10) : undefined;
          break;
        case 'isNew':
        case 'isFeatured':
        case 'isActive':
          product[header] = value.toLowerCase() === 'true';
          break;
        case 'images':
          product[header] = value ? value.split('|') : [];
          break;
      }
    });
    
    products.push(product);
  }
  
  return products;
}

export function generateCSVTemplate(): string {
  const headers = [
    'sku',
    'categoryId',
    'nameEn',
    'nameEt',
    'descriptionEn',
    'descriptionEt',
    'price',
    'salePrice',
    'stock',
    'lowStockThreshold',
    'images',
    'isNew',
    'isFeatured',
    'isActive',
    'metaKeywords',
  ];
  
  const exampleRow = [
    'PROD-001',
    'category-id-here',
    'Product Name English',
    'Toote Nimi Eesti',
    'Product description in English',
    'Toote kirjeldus eesti keeles',
    '499.99',
    '449.99',
    '10',
    '5',
    'image1.jpg|image2.jpg',
    'true',
    'false',
    'true',
    'gaming,console,playstation',
  ];
  
  return `${headers.join(',')}\n${exampleRow.join(',')}\n`;
}
