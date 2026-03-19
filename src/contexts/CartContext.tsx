'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { AvailabilitySlot } from '@/lib/api/availability';

export interface CartItem extends AvailabilitySlot {
  teacherName?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (slot: AvailabilitySlot, teacherName?: string) => void;
  removeFromCart: (slotId: string) => void;
  clearCart: () => void;
  isInCart: (slotId: string) => boolean;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // LocalStorage persistence
  useEffect(() => {
    const saved = localStorage.getItem('lms_booking_cart');
    if (saved) {
      try {
        setCartItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse cart from storage:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lms_booking_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = useCallback((slot: AvailabilitySlot, teacherName?: string) => {
    setCartItems((prev) => {
      const exists = prev.find((item) => item.id === slot.id);
      if (exists) return prev.filter((item) => item.id !== slot.id);
      // Max 20 across all teachers
      if (prev.length >= 20) return prev;
      return [...prev, { ...slot, teacherName }];
    });
  }, []);

  const removeFromCart = useCallback((slotId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== slotId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const isInCart = useCallback((slotId: string) => {
    return cartItems.some((item) => item.id === slotId);
  }, [cartItems]);

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price ? Number(item.price) : 0), 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, isInCart, totalAmount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
