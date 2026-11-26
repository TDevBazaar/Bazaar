"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type { CartItem } from "./types";

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

function getSafeStorage(): StateStorage {
  if (typeof window === "undefined") return noopStorage;
  try {
    return window.localStorage;
  } catch {
    return noopStorage;
  }
}

/** Límite del API por línea (1..99) y máximo de líneas distintas por pedido (20). */
export const MAX_QTY_PER_LINE = 99;
export const MAX_ORDER_LINES = 20;

interface StoreLocalState {
  cart: CartItem[];
  favorites: string[];
  hydrated: boolean;

  addToCart: (item: CartItem) => void;
  setQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;

  toggleFavorite: (productId: string) => void;
  setHydrated: () => void;
}

export const useShopStore = create<StoreLocalState>()(
  persist(
    (set) => ({
      cart: [],
      favorites: [],
      hydrated: false,

      addToCart: (item) =>
        set((state) => {
          const safeQty = Math.min(
            MAX_QTY_PER_LINE,
            Math.max(1, Math.round(item.qty))
          );
          const existing = state.cart.find(
            (line) => line.productId === item.productId
          );
          if (existing) {
            return {
              cart: state.cart.map((line) =>
                line.productId === item.productId
                  ? {
                      ...line,
                      qty: Math.min(MAX_QTY_PER_LINE, line.qty + safeQty),
                    }
                  : line
              ),
            };
          }
          return { cart: [...state.cart, { productId: item.productId, qty: safeQty }] };
        }),

      setQty: (productId, qty) =>
        set((state) => ({
          cart: state.cart
            .map((line) =>
              line.productId === productId
                ? {
                    ...line,
                    qty: Math.min(MAX_QTY_PER_LINE, Math.max(0, Math.round(qty))),
                  }
                : line
            )
            .filter((line) => line.qty > 0),
        })),

      removeItem: (productId) =>
        set((state) => ({
          cart: state.cart.filter((line) => line.productId !== productId),
        })),

      clearCart: () => set({ cart: [] }),

      toggleFavorite: (productId) =>
        set((state) => ({
          favorites: state.favorites.includes(productId)
            ? state.favorites.filter((id) => id !== productId)
            : [...state.favorites, productId],
        })),

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "deve-store-v1",
      storage: createJSONStorage(() => getSafeStorage()),
      version: 1,
      partialize: (state) => ({
        cart: state.cart,
        favorites: state.favorites,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
