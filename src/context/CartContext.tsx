import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem, Product } from '../types';

interface CartContextType {
  items: CartItem[];
  tableToken: string | null;
  tableNumber: string | null;
  locationNote: string | null;
  setTableInfo: (token: string, number: string, note?: string | null) => void;
  addItem: (product: Product, quantity?: number, notes?: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateNotes: (productId: string, notes: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('warkop_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [tableToken, setTableToken] = useState<string | null>(() => {
    return localStorage.getItem('warkop_table_token') || null;
  });

  const [tableNumber, setTableNumber] = useState<string | null>(() => {
    return localStorage.getItem('warkop_table_number') || null;
  });

  const [locationNote, setLocationNote] = useState<string | null>(() => {
    return localStorage.getItem('warkop_table_note') || null;
  });

  useEffect(() => {
    try {
      localStorage.setItem('warkop_cart_items', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [items]);

  const setTableInfo = (token: string, number: string, note?: string | null) => {
    setTableToken(token);
    setTableNumber(number);
    setLocationNote(note || null);
    localStorage.setItem('warkop_table_token', token);
    localStorage.setItem('warkop_table_number', number);
    if (note) {
      localStorage.setItem('warkop_table_note', note);
    } else {
      localStorage.removeItem('warkop_table_note');
    }
  };

  const addItem = (product: Product, quantity = 1, notes = '') => {
    if (!product.isAvailable) return;

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
          notes: notes || updated[existingIndex].notes,
        };
        return updated;
      }
      return [...prev, { product, quantity, notes }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const updateNotes = (productId: string, notes: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, notes } : item
      )
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('warkop_cart_items');
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        tableToken,
        tableNumber,
        locationNote,
        setTableInfo,
        addItem,
        updateQuantity,
        updateNotes,
        removeItem,
        clearCart,
        totalItems,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
