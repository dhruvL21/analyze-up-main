
'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback, useEffect } from 'react';
import type { Product, PurchaseOrder, Supplier, Transaction, Category } from '@/lib/types';
import { mockProducts } from '@/lib/mock-products';
import { mockOrders } from '@/lib/mock-orders';
import { mockSuppliers } from '@/lib/mock-suppliers';
import { mockTransactions } from '@/lib/mock-transactions';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch, getDocs, query, limit } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


// Mock categories for the form dropdowns
const mockCategories: Category[] = [
    { id: 'tops', name: 'Tops', description: '' },
    { id: 'bottoms', name: 'Bottoms', description: '' },
    { id: 'accessories', name: 'Accessories', description: '' },
    { id: 'essentials', name: 'Essentials', description: '' },
];


interface DataContextProps {
  products: Product[];
  orders: PurchaseOrder[];
  suppliers: Supplier[];
  transactions: Transaction[];
  categories: Category[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  addOrder: (order: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  deleteSupplier: (supplierId: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'userId'>) => Promise<void>;
  isLoading: boolean;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

// Helper function to remove duplicates from an array of objects by a given key
const uniqueBy = <T extends Record<string, any>>(array: T[] | null, key: keyof T): T[] => {
  if (!array) return [];
  return Array.from(new Map(array.map(item => [item[key], item])).values());
}


export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const productsRef = useMemo(() => user && firestore ? collection(firestore, 'users', user.uid, 'products') : null, [user, firestore]);
  const ordersRef = useMemo(() => user && firestore ? collection(firestore, 'users', user.uid, 'orders') : null, [user, firestore]);
  const suppliersRef = useMemo(() => user && firestore ? collection(firestore, 'users', user.uid, 'suppliers') : null, [user, firestore]);
  const transactionsRef = useMemo(() => user && firestore ? collection(firestore, 'users', user.uid, 'transactions') : null, [user, firestore]);
  const categoriesRef = useMemo(() => user && firestore ? collection(firestore, 'users', user.uid, 'categories') : null, [user, firestore]);

  const { data: productsData, loading: productsLoading } = useCollection<Product>(productsRef);
  const { data: ordersData, loading: ordersLoading } = useCollection<PurchaseOrder>(ordersRef);
  const { data: suppliersData, loading: suppliersLoading } = useCollection<Supplier>(suppliersRef);
  const { data: transactionsData, loading: transactionsLoading } = useCollection<Transaction>(transactionsRef);
  const { data: categoriesData, loading: categoriesLoading } = useCollection<Category>(categoriesRef);

  const products = useMemo(() => uniqueBy(productsData, 'id'), [productsData]);
  const orders = useMemo(() => uniqueBy(ordersData, 'id'), [ordersData]);
  const suppliers = useMemo(() => uniqueBy(suppliersData, 'name'), [suppliersData]);
  const transactions = useMemo(() => uniqueBy(transactionsData, 'id'), [transactionsData]);
  const categories = useMemo(() => uniqueBy(categoriesData, 'name'), [categoriesData]);

  const isLoading = productsLoading || ordersLoading || suppliersLoading || transactionsLoading || categoriesLoading;

  const addCategory = useCallback(async (categoryData: Omit<Category, 'id' | 'userId'>) => {
     if (!firestore || !user || !categoriesRef) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not add category.' });
        throw new Error("Not authenticated");
    }
    const newCategory = {
      ...categoryData,
      userId: user.uid,
    };
    addDoc(categoriesRef, newCategory).catch((serverError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: categoriesRef.path,
            operation: 'create',
            requestResourceData: newCategory,
        }));
    });
  }, [firestore, user, categoriesRef, toast]);


  const addProduct = useCallback(async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!firestore || !user || !productsRef) return;
    const newProduct = {
      ...productData,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      averageDailySales: Math.floor(Math.random() * 10) + 1,
      leadTimeDays: Math.floor(Math.random() * 10) + 5,
    };
    addDoc(productsRef, newProduct).catch((serverError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: productsRef.path,
            operation: 'create',
            requestResourceData: newProduct,
        }));
    });
    toast({ title: 'Product Added', description: `${productData.name} has been added.` });
  }, [firestore, user, productsRef, toast]);

  const updateProduct = useCallback(async (updatedProduct: Product) => {
    if (!firestore || !user) return;
    const productRef = doc(firestore, 'users', user.uid, 'products', updatedProduct.id);
    const { id, ...updateData } = updatedProduct;
    const dataToUpdate = { ...updateData, updatedAt: serverTimestamp() };
    updateDoc(productRef, dataToUpdate).catch((serverError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: productRef.path,
            operation: 'update',
            requestResourceData: dataToUpdate,
        }));
    });
    toast({ title: 'Product Updated', description: `${updatedProduct.name} has been updated.` });
  }, [firestore, user, toast]);
  
  const deleteProduct = useCallback(async (productId: string) => {
    if (!firestore || !user) return;
    const productRef = doc(firestore, 'users', user.uid, 'products', productId);
    deleteDoc(productRef).catch((serverError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: productRef.path,
            operation: 'delete',
        }));
    });
    toast({ title: 'Product Deleted', description: 'The product has been removed.' });
  }, [firestore, user, toast]);

  const addOrder = useCallback(async (orderData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!firestore || !user || !ordersRef || !transactionsRef) return;

    const batch = writeBatch(firestore);
    
    const newOrderRef = doc(ordersRef);
    const newOrder = {
        ...orderData,
        id: newOrderRef.id,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    batch.set(newOrderRef, newOrder);

    const newTransactionRef = doc(transactionsRef);
    const newTransaction = {
        userId: user.uid,
        productId: newOrder.productId,
        locationId: 'MAIN-WAREHOUSE',
        type: 'Purchase' as const,
        quantity: newOrder.quantity,
        transactionDate: newOrder.orderDate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    batch.set(newTransactionRef, newTransaction);
    
    batch.commit().catch((serverError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'batch-write', // Or be more specific if possible
            operation: 'create',
            requestResourceData: { order: newOrder, transaction: newTransaction },
        }));
    });
    const supplierName = suppliers.find(s => s.id === newOrder.supplierId)?.name || 'the supplier';
    toast({ title: 'Order Created', description: `New purchase order for ${supplierName} has been created.` });
  }, [firestore, user, ordersRef, transactionsRef, suppliers, toast]);

  const deleteOrder = useCallback(async (orderId: string) => {
    if (!firestore || !user) return;
    const orderRef = doc(firestore, 'users', user.uid, 'orders', orderId);
    deleteDoc(orderRef).catch((serverError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: orderRef.path,
            operation: 'delete',
        }));
    });
    toast({ title: 'Order Deleted', description: 'The purchase order has been removed.' });
  }, [firestore, user, toast]);

  const updateOrderStatus = useCallback(async (orderId: string, status: string) => {
    if (!firestore || !user) return;
    const orderRef = doc(firestore, 'users', user.uid, 'orders', orderId);
    const orderToUpdate = orders.find(o => o.id === orderId);
    if (!orderToUpdate) return;

    const batch = writeBatch(firestore);
    
    batch.update(orderRef, { status, updatedAt: serverTimestamp() });

    if (status === 'Fulfilled') {
        const productRef = doc(firestore, 'users', user.uid, 'products', orderToUpdate.productId);
        const product = products.find(p => p.id === orderToUpdate.productId);
        if (product) {
            batch.update(productRef, { stock: product.stock + orderToUpdate.quantity });
        }
        toast({ title: 'Order Fulfilled', description: `Order ${orderId.substring(0,8)}... marked as fulfilled and stock updated.` });
    } else {
        toast({ title: 'Order Status Updated', description: `Order ${orderId.substring(0,8)}... has been marked as ${status}.` });
    }
    
    batch.commit().catch((serverError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'batch-write',
            operation: 'update',
        }));
    });
  }, [firestore, user, orders, products, toast]);

  const addSupplier = useCallback(async (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
     if (!firestore || !user || !suppliersRef) return;
     if (suppliers.find((s) => s.name.toLowerCase() === supplierData.name.toLowerCase())) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'A supplier with this name already exists.',
      });
      return;
    }
    const newSupplier = {
      ...supplierData,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    addDoc(suppliersRef, newSupplier).catch((serverError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: suppliersRef.path,
            operation: 'create',
            requestResourceData: newSupplier,
        }));
    });
    toast({ title: 'Supplier Added', description: `${supplierData.name} has been added.` });
  }, [firestore, user, suppliers, suppliersRef, toast]);

  const deleteSupplier = useCallback(async (supplierId: string) => {
    if (!firestore || !user) return;
    const supplierRef = doc(firestore, 'users', user.uid, 'suppliers', supplierId);
    deleteDoc(supplierRef).catch((serverError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: supplierRef.path,
            operation: 'delete',
        }));
    });
    toast({ title: 'Supplier Deleted', description: 'The supplier has been removed.' });
  }, [firestore, user, toast]);
  
  // Seed initial data for new users
  useEffect(() => {
    if (!user || !firestore || productsLoading || suppliersLoading || ordersLoading || transactionsLoading || categoriesLoading) {
      return;
    }

    let isSeeding = false;
    const checkForDataAndSeed = async () => {
        if (isSeeding) return;
        const collectionsToCheck = [productsRef, suppliersRef, ordersRef, transactionsRef, categoriesRef];
        let isDbEmpty = true;

        for (const ref of collectionsToCheck) {
            if (ref) {
                const snapshot = await getDocs(query(ref, limit(1)));
                if (!snapshot.empty) {
                    isDbEmpty = false;
                    break;
                }
            }
        }

        if (isDbEmpty) {
            isSeeding = true;
            console.log('Seeding initial data for new user...');
            const batch = writeBatch(firestore);

            mockProducts.forEach(product => {
                const { id, ...rest } = product;
                const prodRef = doc(collection(firestore, 'users', user.uid, 'products'));
                batch.set(prodRef, { ...rest, userId: user.uid });
            });
            mockSuppliers.forEach(supplier => {
                const { id, ...rest } = supplier;
                const supRef = doc(collection(firestore, 'users', user.uid, 'suppliers'));
                batch.set(supRef, { ...rest, userId: user.uid });
            });
            mockOrders.forEach(order => {
                const { id, ...rest } = order;
                const orderRef = doc(collection(firestore, 'users', user.uid, 'orders'));
                batch.set(orderRef, { ...rest, userId: user.uid });
            });
            mockTransactions.forEach(transaction => {
                const { id, ...rest } = transaction;
                const transRef = doc(collection(firestore, 'users', user.uid, 'transactions'));
                batch.set(transRef, { ...rest, userId: user.uid });
            });
            mockCategories.forEach(category => {
                const { id, ...rest } = category;
                const catRef = doc(collection(firestore, 'users', user.uid, 'categories'));
                batch.set(catRef, { ...rest, name: category.name, userId: user.uid });
            });

            batch.commit().then(() => {
                console.log('Initial data seeded successfully.');
                isSeeding = false;
            }).catch(error => {
                console.error("Error seeding data: ", error);
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: `users/${user.uid}`,
                    operation: 'create',
                    requestResourceData: 'Initial Seed Data Batch'
                }));
                isSeeding = false;
            });
        }
    };
    
    checkForDataAndSeed();

  }, [user, firestore, productsLoading, suppliersLoading, ordersLoading, transactionsLoading, categoriesLoading, productsRef, suppliersRef, ordersRef, transactionsRef, categoriesRef]);

  const value = useMemo(() => ({
    products,
    orders,
    suppliers,
    transactions,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    addOrder,
    deleteOrder,
    updateOrderStatus,
    addSupplier,
    deleteSupplier,
    addCategory,
    isLoading,
  }), [
    products,
    orders,
    suppliers,
    transactions,
    categories,
    isLoading,
    addProduct,
    updateProduct,
    deleteProduct,
    addOrder,
    deleteOrder,
    updateOrderStatus,
    addSupplier,
    deleteSupplier,
    addCategory
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
