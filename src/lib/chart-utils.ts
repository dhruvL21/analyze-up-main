import { Transaction, Product, Category } from './types';
import { Timestamp } from 'firebase/firestore';

export interface ChartDataItem {
  name: string;
  sales: number;
}

export function getMonthlySalesData(
  transactions: Transaction[],
  products: Product[]
): ChartDataItem[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  
  const monthlyData: { [key: string]: number } = {};
  months.forEach(m => monthlyData[m] = 0);

  transactions.forEach(t => {
    // We only plot Sales for the primary "Sales Performance" chart
    if (t.type !== 'Sale') return;

    let date: Date;
    if (t.transactionDate instanceof Timestamp) {
      date = t.transactionDate.toDate();
    } else if (typeof t.transactionDate === 'string') {
      date = new Date(t.transactionDate);
    } else {
      return;
    }

    if (date.getFullYear() === currentYear) {
      const monthName = months[date.getMonth()];
      const product = products.find(p => p.id === t.productId);
      const saleAmount = t.quantity * (product?.price || 0);
      monthlyData[monthName] += saleAmount;
    }
  });

  return months.map(name => ({
    name,
    sales: monthlyData[name],
  }));
}

export function getStockByCategoryData(
  products: Product[],
  categories: Category[]
): ChartDataItem[] {
  const categoryMap: { [key: string]: number } = {};

  products.forEach(p => {
    const category = categories.find(c => c.id === p.categoryId);
    const categoryName = category?.name || 'Uncategorized';
    categoryMap[categoryName] = (categoryMap[categoryName] || 0) + p.stock;
  });

  return Object.entries(categoryMap).map(([name, stock]) => ({
    name,
    sales: stock,
  }));
}

export function getInventoryValueData(
    products: Product[],
    categories: Category[]
): ChartDataItem[] {
    const categoryMap: { [key: string]: number } = {};

    products.forEach(p => {
        const category = categories.find(c => c.id === p.categoryId);
        const categoryName = category?.name || 'Uncategorized';
        const value = p.stock * p.price;
        categoryMap[categoryName] = (categoryMap[categoryName] || 0) + value;
    });

    return Object.entries(categoryMap).map(([name, value]) => ({
        name,
        sales: value,
    }));
}
