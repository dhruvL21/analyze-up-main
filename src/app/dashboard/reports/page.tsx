
'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DollarSign,
  ShoppingCart,
  Package,
  Download,
} from 'lucide-react';
import { SalesChart } from '@/components/sales-chart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Papa from 'papaparse';
import type { Product, Transaction } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { subDays } from 'date-fns';
import { useData } from '@/context/data-context';

type ReportType = 'inventory_summary' | 'sales_report' | 'transaction_log';
type DateRange = '7' | '30' | '90' | 'all';

export default function ReportsPage() {
  const { products, transactions, isLoading } = useData();
  const [reportType, setReportType] = useState<ReportType>('inventory_summary');
  const [dateRange, setDateRange] = useState<DateRange>('30');

  useEffect(() => {
    if (isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          } else {
            entry.target.classList.remove("revealed");
          }
        });
      },
      {
        root: null,
        threshold: 0.1,
        rootMargin: "0px 0px -10% 0px"
      }
    );

    const items = document.querySelectorAll(".scroll-reveal-item");
    items.forEach(el => observer.observe(el));

    return () => items.forEach(el => observer.unobserve(el));
  }, [isLoading]);

  const getFilteredTransactions = () => {
    if (dateRange === 'all') return transactions;
    const rangeStartDate = subDays(new Date(), parseInt(dateRange));
    return transactions.filter((t) => {
      const transactionDate = new Date(t.transactionDate as string);
      return transactionDate >= rangeStartDate;
    });
  };

  const filteredTransactions = getFilteredTransactions();

  const totalRevenue =
    filteredTransactions
      .filter((t) => t.type === 'Sale')
      .reduce((acc, t) => {
        const product = products.find((p) => p.id === t.productId);
        return acc + t.quantity * (product?.price || 0);
      }, 0) || 0;

  const topSellingProducts = [...products]
    .map(product => {
      const sales =
        filteredTransactions
          .filter((t) => t.productId === product.id && t.type === 'Sale')
          .reduce((acc, t) => acc + t.quantity, 0) || 0;
      const revenue = sales * product.price;
      return { ...product, revenue };
    })
    .sort((a,b) => b.revenue - a.revenue)
    .slice(0, 5);

  const totalProductsInStock =
    products.reduce((acc, p) => acc + p.stock, 0) || 0;
  const totalOrders = filteredTransactions.filter((t) => t.type === 'Sale').length || 0;

  const handleDownloadCsv = () => {
    let dataToExport: any[] = [];
    let filename = 'report.csv';

    const localFilteredTransactions = getFilteredTransactions();

    switch (reportType) {
      case 'inventory_summary':
        dataToExport = products.map((p) => ({
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          stock: p.stock,
          price: p.price.toFixed(2),
          inventoryValue: (p.stock * p.price).toFixed(2),
          category: p.categoryId,
        }));
        filename = `inventory_summary_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'sales_report':
        dataToExport = localFilteredTransactions
          .filter((t) => t.type === 'Sale')
          .map((t) => {
            const product = products.find((p) => p.id === t.productId);
            const revenue = product ? t.quantity * product.price : 0;
            return {
              transactionId: t.id,
              transactionDate: t.transactionDate,
              productId: t.productId,
              productName: product?.name || 'Unknown',
              quantitySold: t.quantity,
              pricePerUnit: product?.price.toFixed(2) || '0.00',
              totalRevenue: revenue.toFixed(2),
            };
          });
        filename = `sales_report_${dateRange}days_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'transaction_log':
        dataToExport = localFilteredTransactions.map((t) => {
           const product = products.find((p) => p.id === t.productId);
            return {
                transactionId: t.id,
                transactionDate: t.transactionDate,
                type: t.type,
                productId: t.productId,
                productName: product?.name || 'Unknown',
                quantity: t.quantity,
                locationId: t.locationId,
            }
        });
        filename = `transaction_log_${dateRange}days_${new Date().toISOString().split('T')[0]}.csv`;
        break;
    }

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-t8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <h1 className="text-lg font-semibold md:text-2xl">Reports</h1>
        <div className="sm:ml-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
           <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inventory_summary">Inventory Summary</SelectItem>
              <SelectItem value="sales_report">Sales Report</SelectItem>
              <SelectItem value="transaction_log">Transaction Log</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleDownloadCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="scroll-reveal-item">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {totalRevenue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {dateRange === 'all' ? 'From all sales' : `From sales in the last ${dateRange} days`}
            </p>
          </CardContent>
        </Card>
        <Card className="scroll-reveal-item">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
             {dateRange === 'all' ? 'Total sales transactions' : `Sales transactions in the last ${dateRange} days`}
            </p>
          </CardContent>
        </Card>
        <Card className="scroll-reveal-item">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Products in Stock
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalProductsInStock.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Across all products</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
        <Card className="scroll-reveal-item">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>
              Your sales trend over the last 12 months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SalesChart />
          </CardContent>
        </Card>
        <Card className='relative scroll-reveal-item'>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>
              {`Your best-performing products by revenue ${dateRange === 'all' ? 'of all time' : `in the last ${dateRange} days`}.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSellingProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell className="text-right">
                      $
                      {product.revenue.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
