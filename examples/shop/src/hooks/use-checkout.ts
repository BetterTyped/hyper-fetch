import { create } from "zustand";

interface CheckoutState {
  checkout: boolean;
  setCheckout: (checkout: boolean) => void;
}

export const useCheckout = create<CheckoutState>((set) => ({
  checkout: false,
  setCheckout: (checkout) => set({ checkout }),
}));
