import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    cart: [],
    total: 0,
  },
  reducers: {
    addItem: (state, action) => {
      const exists = state.cart.find((item) => item.productId === action.payload.productId);
      if (exists) {
        exists.quantity += action.payload.quantity;
      } else {
        state.cart.push(action.payload);
      }
      state.total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },
    removeItem: (state, action) => {
      state.cart = state.cart.filter((item) => item.productId !== action.payload);
      state.total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },
    updateQuantity: (state, action) => {
      const item = state.cart.find((item) => item.productId === action.payload.productId);
      if (item) {
        item.quantity = action.payload.quantity;
        if (item.quantity <= 0) {
          state.cart = state.cart.filter((i) => i.productId !== action.payload.productId);
        }
      }
      state.total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },
    clearCart: (state) => {
      state.cart = [];
      state.total = 0;
    },
    setCart: (state, action) => {
      state.cart = action.payload;
      state.total = action.payload.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },
  },
});

export const { addItem, removeItem, updateQuantity, clearCart, setCart } = cartSlice.actions;
export default cartSlice.reducer;
