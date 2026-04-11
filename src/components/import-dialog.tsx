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
import { Product } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRODUCT_FIELDS: { label: string; value: keyof Product }[] = [
  { label: 'Name', value: 'name' },
  { label: 'SKU', value: 'sku' },
  { label: 'Price', value: 'price' },
  { label: 'Stock', value: 'stock' },
  { label: 'Description', value: 'description' },
  { label: 'Category ID', value: 'categoryId' },
  { label: 'Supplier ID', value: 'supplierId' },
  { label: 'Image URL', value: 'imageUrl' },
];

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const { bulkAddProducts, suppliers, categories } = useData();
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
          if (targetKey === 'price' || targetKey === 'stock') {
            value = parseFloat(value) || 0;
          }
          product[targetKey] = value;
        }
      });

      return product as Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'userId'>;
    });

    try {
      await bulkAddProducts(productsToImport);
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
      <DialogContent className="sm:max-w-[600px] ios-glass">
        <DialogHeader>
          <DialogTitle>Import Brand Database</DialogTitle>
          <DialogDescription>
            Upload a CSV or JSON file from your brand. AI will help map the attributes.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-xl p-12 gap-4">
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
                <div key={externalKey} className="grid grid-cols-2 items-center gap-4 border-b pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
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
                      {PRODUCT_FIELDS.map((field) => (
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

        <DialogFooter className="gap-2">
          {step === 'map' && (
            <>
              <Button variant="ghost" onClick={() => setStep('upload')}>Back</Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>Finalize Import ({rawData.length} items)</>
                )}
              </Button>
            </>
          )}
          {step === 'upload' && (
             <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
             </DialogClose>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
