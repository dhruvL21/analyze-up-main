'use client';

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useData } from '@/context/data-context';
import { Upload, FileText, Check, Loader2, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { getSmartMapping, FieldMapping } from '@/ai/flows/import-mapper';
import { Product, Transaction } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRODUCT_FIELDS: { label: string; value: string }[] = [
  { label: 'Name', value: 'name' },
  { label: 'SKU', value: 'sku' },
  { label: 'Price (Selling)', value: 'price' },
  { label: 'Cost Price (Buying)', value: 'costPrice' },
  { label: 'Stock', value: 'stock' },
  { label: 'Description', value: 'description' },
  { label: 'Category ID', value: 'categoryId' },
  { label: 'Supplier ID', value: 'supplierId' },
];

const TRANSACTION_FIELDS: { label: string; value: string }[] = [
    { label: 'Product SKU', value: 'productSku' },
    { label: 'Quantity', value: 'quantity' },
    { label: 'Unit Price', value: 'price' },
    { label: 'Date (MM/DD/YYYY)', value: 'transactionDate' },
    { label: 'Type (Sale/Purchase)', value: 'type' },
];

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const { bulkAddProducts, addTransaction, products, suppliers, categories } = useData();
  const [importType, setImportType] = useState<'products' | 'sales'>('products');
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [mapping, setMapping] = useState<FieldMapping | null>(null);
  const [rawData, setRawData] = useState<any[]>([]);
  const [step, setStep] = useState<'upload' | 'map' | 'preview'>('upload');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const processFile = async () => {
    if (!file) return;
    setParsing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const headers = results.meta.fields || [];
        setRawData(results.data);
        
        // Get smart mapping from AI
        const aiMapping = await getSmartMapping(headers);
        setMapping(aiMapping);
        setStep('map');
        setParsing(false);
      },
      error: (error) => {
        console.error('CSV Parsing Error:', error);
        setParsing(false);
      },
    });
  };

  const handleImport = async () => {
    if (!mapping || rawData.length === 0) return;
    setImporting(true);

    const productsToImport: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'userId'>[] = rawData.map((row) => {
      const product: any = {};
      
      // Defaults
      product.categoryId = categories[0]?.id || 'essentials';
      product.supplierId = suppliers[0]?.id || 'SUP001';
      product.description = '';
      product.imageUrl = '';
      product.stock = 0;
      product.price = 0;

      // Map from mapping
      Object.entries(mapping).forEach(([externalKey, targetKey]) => {
        if (targetKey !== 'skip') {
          let value = row[externalKey];
          if (targetKey === 'price' || targetKey === 'stock' || targetKey === 'costPrice') {
            value = parseFloat(value) || 0;
          }
          product[targetKey] = value;
        }
      });

      return product as Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'userId'>;
    });

    try {
      if (importType === 'products') {
        await bulkAddProducts(productsToImport);
      } else {
        // Import Sales/Transactions
        for (const row of rawData) {
            const trn: any = {};
            Object.entries(mapping).forEach(([externalKey, targetKey]) => {
                if (targetKey !== 'skip') {
                    trn[targetKey] = row[externalKey];
                }
            });

            const product = products.find(p => p.sku === trn.productSku);
            if (!product) continue;

            await addTransaction({
                productId: product.id,
                type: (trn.type || 'Sale') as 'Sale' | 'Purchase',
                quantity: Number(trn.quantity) || 1,
                price: Number(trn.price) || (trn.type === 'Purchase' ? product.costPrice : product.price),
                transactionDate: trn.transactionDate ? new Date(trn.transactionDate).toISOString() : new Date().toISOString(),
                locationId: 'MAIN-WAREHOUSE'
            });
        }
      }
      onOpenChange(false);
      setStep('upload');
      setFile(null);
      setMapping(null);
    } catch (err) {
      console.error('Import failed:', err);
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setMapping(null);
    setStep('upload');
    setRawData([]);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if(!val) reset(); }}>
      <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto ios-glass p-0">
        <div className="p-6">
          <DialogHeader>
            <DialogTitle>Import Data Streams</DialogTitle>
            <DialogDescription>
               Upload a CSV or JSON file. AI will help map the attributes to our financial models.
            </DialogDescription>
          </DialogHeader>

          {step === 'upload' && (
            <div className="space-y-6 mt-6">
              <Tabs value={importType} onValueChange={(v) => setImportType(v as any)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-auto gap-1 p-1">
                      <TabsTrigger value="products" className="py-2 text-xs sm:text-sm">Inventory Database</TabsTrigger>
                      <TabsTrigger value="sales" className="py-2 text-xs sm:text-sm">Sales & Transactions</TabsTrigger>
                  </TabsList>
              </Tabs>

              <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-xl p-6 sm:p-12 gap-4">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">CSV, JSON (Max 10MB)</p>
            </div>
            <input
              type="file"
              accept=".csv,.json"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              {file ? file.name : 'Select File'}
            </Button>
            {file && (
              <Button className="w-full mt-4" onClick={processFile} disabled={parsing}>
                {parsing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Schema with AI...
                  </>
                ) : (
                  'Process File'
                )}
              </Button>
            )}
          </div>
        </div>
        )}

        {step === 'map' && mapping && (
          <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto pr-2">
            <Alert variant="default" className="bg-primary/10 border-primary/20">
              <Check className="h-4 w-4 text-primary" />
              <AlertTitle>Smart Mapping Active</AlertTitle>
              <AlertDescription>
                AI has automatically mapped your database columns to our system. Review them below.
              </AlertDescription>
            </Alert>
            
            <div className="grid gap-4">
              {Object.keys(mapping).map((externalKey) => (
                <div key={externalKey} className="grid grid-cols-1 sm:grid-cols-2 items-start sm:items-center gap-2 sm:gap-4 border-b pb-3 sm:pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium truncate">{externalKey}</span>
                  </div>
                  <Select
                    value={mapping[externalKey]}
                    onValueChange={(val) => setMapping({ ...mapping, [externalKey]: val as any })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">Skip Field</SelectItem>
                      {(importType === 'products' ? PRODUCT_FIELDS : TRANSACTION_FIELDS).map((field) => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        )}

          <DialogFooter className="p-6 bg-muted/30 gap-2 border-t">
            {step === 'map' && (
              <>
                <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setStep('upload')}>Back</Button>
                <Button className="w-full sm:w-auto" onClick={handleImport} disabled={importing}>
                  {importing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>Finalize Import ({rawData.length})</>
                  )}
                </Button>
              </>
            )}
            {step === 'upload' && (
               <DialogClose asChild>
                  <Button variant="ghost" className="w-full sm:w-auto">Cancel</Button>
               </DialogClose>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
