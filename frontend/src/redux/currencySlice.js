import { createSlice } from '@reduxjs/toolkit';

const CURRENCY_STORAGE_KEY = 'currency';

const getInitialCurrency = () => {
  const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
  if (savedCurrency && ['INR', 'USD', 'EUR', 'GBP'].includes(savedCurrency)) {
    return savedCurrency;
  }
  return 'INR';
};

const currencySlice = createSlice({
  name: 'currency',
  initialState: {
    selectedCurrency: getInitialCurrency(),
  },
  reducers: {
    setCurrency: (state, action) => {
      state.selectedCurrency = action.payload;
      localStorage.setItem(CURRENCY_STORAGE_KEY, action.payload);
    },
  },
});

export const { setCurrency } = currencySlice.actions;
export default currencySlice.reducer;
