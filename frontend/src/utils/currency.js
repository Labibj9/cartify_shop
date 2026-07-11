export const SUPPORTED_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

export const formatPrice = (amount, currency = 'INR') => {
  const numericAmount = Number(amount || 0);
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(numericAmount);
};
