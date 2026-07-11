import { createSlice } from '@reduxjs/toolkit';

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    items: [],
  },
  reducers: {
    setWishlist: (state, action) => {
      state.items = action.payload || [];
    },
    addWishlistItem: (state, action) => {
      const product = action.payload;
      const exists = state.items.some((item) => item._id === product._id);
      if (!exists) {
        state.items.push(product);
      }
    },
    removeWishlistItem: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter((item) => item._id !== productId);
    },
    clearWishlist: (state) => {
      state.items = [];
    },
  },
});

export const { setWishlist, addWishlistItem, removeWishlistItem, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
