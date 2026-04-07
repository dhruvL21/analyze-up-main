
'use client';

import Image from 'next/image';
import React, { useState, useRef, useEffect } from 'react';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useData } from '@/context/data-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


export default function InventoryPage() {
  const { products, addProduct, updateProduct, deleteProduct, isLoading, categories, suppliers, addCategory, addSupplier } = useData();

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | undefined>(undefined);

  const productFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (isLoading || products.length === 0) return;

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
  }, [products, isLoading]);


  const resetFormState = () => {
    setEditingProduct(null);
    setDescription('');
    setImagePreview(null);
    setSelectedCategoryId(undefined);
    setSelectedSupplierId(undefined);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    let imageUrl = editingProduct?.imageUrl || `https://picsum.photos/seed/${Date.now()}/400/400`;
    if (imagePreview) {
        imageUrl = imagePreview;
    }

    const productData = {
      name: formData.get('name') as string,
      stock: Number(formData.get('stock')),
      price: Number(formData.get('price')),
      categoryId: selectedCategoryId || formData.get('categoryId') as string,
      supplierId: selectedSupplierId || formData.get('supplierId') as string,
      imageUrl: imageUrl,
      description: description,
      sku: 'SKU-' + Date.now().toString(36),
    };

    if (editingProduct) {
      const updatedProduct = {
        ...editingProduct,
        ...productData,
        description: description,
        updatedAt: new Date().toISOString(),
      };
      updateProduct(updatedProduct);
    } else {
      addProduct(productData);
    }

    setIsFormDialogOpen(false);
  };
  
  const handleCategorySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newCategory = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
    };
    await addCategory(newCategory);
    
    const createdCategory = categories.find(c => c.name === newCategory.name);
    if(createdCategory) {
      setSelectedCategoryId(createdCategory.id);
    }
    
    setIsCategoryDialogOpen(false);
  };

  const handleSupplierSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newSupplier = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      contactName: (formData.get('name') as string).split(' ')[0] || 'Contact',
      phone: 'N/A',
      address: 'N/A',
    };
    await addSupplier(newSupplier);

    const createdSupplier = suppliers.find(s => s.name === newSupplier.name);
    if (createdSupplier) {
      setSelectedSupplierId(createdSupplier.id);
    }

    setIsSupplierDialogOpen(false);
  };

  const openEditDialog = (product: Product) => {
    resetFormState();
    setEditingProduct(product);
    setDescription(product.description || '');
    setImagePreview(product.imageUrl || null);
    setSelectedCategoryId(product.categoryId);
    setSelectedSupplierId(product.supplierId);
    setIsFormDialogOpen(true);
  };

  const openAddDialog = () => {
    resetFormState();
    setIsFormDialogOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-8">
        <div className="flex items-center">
          <h1 className="text-2xl font-semibold md:text-3xl">Inventory</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" onClick={openAddDialog}>
              <PlusCircle className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">Add Product</span>
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>
              Manage your products and view their inventory levels.
            </CardDescription>
          </CardHeader>
          <div className="relative">
             <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden w-[100px] sm:table-cell">
                      <span className="sr-only">Image</span>
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Price</TableHead>
                    <TableHead className="hidden md:table-cell">Stock</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="hidden sm:table-cell">
                          <div className="aspect-square rounded-lg bg-secondary w-16 h-16 animate-pulse" />
                        </TableCell>
                        <TableCell><div className='h-5 w-24 sm:w-32 bg-secondary rounded-md animate-pulse'/></TableCell>
                        <TableCell><div className='h-6 w-20 bg-secondary rounded-full animate-pulse'/></TableCell>
                        <TableCell className="hidden md:table-cell"><div className='h-5 w-16 bg-secondary rounded-md animate-pulse'/></TableCell>
                        <TableCell className="hidden md:table-cell"><div className='h-5 w-10 bg-secondary rounded-md animate-pulse'/></TableCell>
                        <TableCell><div className='h-8 w-8 bg-secondary rounded-full animate-pulse'/></TableCell>
                      </TableRow>
                    ))
                  ) : (
                  products.map((product) => (
                    <TableRow key={product.id} className="scroll-reveal-item">
                      <TableCell className="hidden sm:table-cell">
                        <Image
                          alt={product.name}
                          className="aspect-square rounded-lg object-cover"
                          height="64"
                          src={product.imageUrl || 'https://placehold.co/64x64'}
                          width="64"
                          unoptimized
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            product.stock > 20
                              ? 'outline'
                              : product.stock > 0
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {product.stock > 20
                            ? 'In Stock'
                            : product.stock > 0
                            ? 'Low Stock'
                            : 'Out of Stock'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        ${typeof product.price === 'number' ? product.price.toFixed(2) : 'N/A'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {product.stock}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                              className='rounded-full'
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => openEditDialog(product)}
                            >
                              Edit
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-destructive"
                                >
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Are you sure?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will
                                    permanently delete the product.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteProduct(product.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )))}
                </TableBody>
              </Table>
            </CardContent>
          </div>
        </Card>
      </div>

    {/* Add/Edit Product Dialog */}
    <Dialog open={isFormDialogOpen} onOpenChange={(isOpen) => {
        setIsFormDialogOpen(isOpen);
        if (!isOpen) resetFormState();
    }}>
      <DialogContent className="sm:max-w-xl ios-glass">
        <DialogHeader>
            <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add Product'}
            </DialogTitle>
            <DialogDescription>
                {editingProduct
                ? 'Update the details of your product.'
                : 'Add a new product to your inventory.'}
            </DialogDescription>
        </DialogHeader>

        <form
          ref={productFormRef}
          id="product-form"
          onSubmit={handleFormSubmit}
          className="grid gap-4 py-4"
        >
          <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingProduct?.name}
                required
                className="col-span-3"
              />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="col-span-3"
            />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image" className="text-right">Image</Label>
                <div className="col-span-3 flex items-center gap-4">
                    {imagePreview && (
                    <Image
                        src={imagePreview}
                        alt="Product preview"
                        width={64}
                        height={64}
                        className="aspect-square rounded-lg object-cover"
                    />
                    )}
                    <Input
                    id="image"
                    name="image"
                    type="file"
                    className="file:text-foreground flex-1"
                    onChange={handleFileChange}
                    accept="image/*"
                    />
                </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">Price</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  defaultValue={editingProduct?.price}
                  required
                  className="col-span-3"
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stock" className="text-right">Stock</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  defaultValue={editingProduct?.stock}
                  required
                  className="col-span-3"
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="categoryId" className="text-right">Category</Label>
                <Select 
                    name="categoryId" 
                    value={selectedCategoryId}
                    onValueChange={(value) => {
                    if (value === 'create-new') {
                        setIsCategoryDialogOpen(true);
                    } else {
                        setSelectedCategoryId(value);
                    }
                    }}
                >
                    <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                    {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                        {category.name}
                        </SelectItem>
                    ))}
                    <SelectItem value="create-new" className='italic text-primary'>
                        Create new category...
                    </SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplierId" className="text-right">Supplier</Label>
                <Select 
                    name="supplierId" 
                    value={selectedSupplierId}
                    onValueChange={(value) => {
                    if (value === 'create-new-supplier') {
                        setIsSupplierDialogOpen(true);
                    } else {
                        setSelectedSupplierId(value);
                    }
                    }}
                    defaultValue={editingProduct?.supplierId}
                >
                    <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                    {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                        </SelectItem>
                    ))}
                    <SelectItem value="create-new-supplier" className='italic text-primary'>
                        Create new supplier...
                    </SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </form>
        <DialogFooter className="pt-4">
            <DialogClose asChild>
            <Button type="button" variant="secondary">
                Cancel
            </Button>
            </DialogClose>
            <Button type="submit" form="product-form">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Add Category Dialog */}
    <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="ios-glass">
            <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogDescription>Create a new category for your products.</DialogDescription>
            </DialogHeader>
            <form id="category-form" onSubmit={handleCategorySubmit} className="grid gap-4 py-4">
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" name="name" className="col-span-3" required />
                </div>
                 <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="description" className="text-right pt-2">Description</Label>
                    <Textarea id="description" name="description" className="col-span-3" />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">Save Category</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>

    {/* Add Supplier Dialog */}
    <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
      <DialogContent className="ios-glass">
        <DialogHeader>
          <DialogTitle>Add New Supplier</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSupplierSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="supplier-name" className="text-right">
              Name
            </Label>
            <Input id="name" name="name" className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="supplier-email" className="text-right">
              Contact Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              className="col-span-3"
              required
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Add Supplier</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
