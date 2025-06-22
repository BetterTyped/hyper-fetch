import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Draft } from "immer";

export type ProductCartItem = {
  __key: string;
  name: string;
  amount: number;
  price: number;
  image: string;
  quantity: number;
  discount: number;
  promotion: boolean;
};

interface CartState {
  items: ProductCartItem[];
  setState: (state: Partial<CartState> | ((draft: Draft<CartState>) => void)) => void;
  addProduct: (product: Omit<ProductCartItem, "amount">) => void;
  removeProduct: (productId: string) => void;
  clearCart: () => void;
}

export const useCart = create(
  immer<CartState>((set) => ({
    items: [],
    setState: (state) => set(state),
    addProduct: (product) =>
      set((state) => {
        const existingProduct = state.items.find((item) => item.__key === product.__key);
        if (existingProduct) {
          existingProduct.amount += 1;
        } else {
          state.items.push({ ...product, amount: 1 });
        }
      }),
    removeProduct: (productId) =>
      set((state) => {
        // eslint-disable-next-line no-param-reassign
        state.items = state.items.filter((item) => item.__key !== productId);
      }),
    clearCart: () =>
      set((state) => {
        // eslint-disable-next-line no-param-reassign
        state.items = [];
      }),
  })),
);
