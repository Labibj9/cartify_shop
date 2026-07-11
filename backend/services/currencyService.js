const SUPPORTED_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];
const BASE_CURRENCY = 'INR';
const CACHE_DURATION_MS = 60 * 60 * 1000;
const FALLBACK_RATES = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
};

let ratesCache = {
  rates: null,
  fetchedAt: 0,
};

const normalizeCurrency = (currency) => {
  if (!currency || typeof currency !== 'string') return BASE_CURRENCY;
  const normalized = currency.toUpperCase();
  return SUPPORTED_CURRENCIES.includes(normalized) ? normalized : BASE_CURRENCY;
};

const normalizeAndValidateRates = (rates) => {
  if (!rates || typeof rates !== 'object') {
    throw new Error('Exchange rate API returned invalid response');
  }

  const normalizedRates = {
    ...rates,
    INR: 1,
  };

  for (const currency of SUPPORTED_CURRENCIES) {
    if (typeof normalizedRates[currency] !== 'number' || normalizedRates[currency] <= 0) {
      throw new Error(`Missing or invalid rate for ${currency}`);
    }
  }

  return normalizedRates;
};

const fetchRatesFromApi = async () => {
  const symbols = SUPPORTED_CURRENCIES.join(',');

  const providers = [
    async () => {
      const response = await fetch(`https://api.exchangerate.host/latest?base=${BASE_CURRENCY}&symbols=${symbols}`);
      if (!response.ok) {
        throw new Error(`Exchange rate API failed with status ${response.status}`);
      }
      const data = await response.json();
      return normalizeAndValidateRates(data.rates);
    },
    async () => {
      const response = await fetch(`https://open.er-api.com/v6/latest/${BASE_CURRENCY}`);
      if (!response.ok) {
        throw new Error(`Fallback exchange rate API failed with status ${response.status}`);
      }
      const data = await response.json();
      return normalizeAndValidateRates(data.rates);
    },
  ];

  let lastError = null;
  for (const provider of providers) {
    try {
      return await provider();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Unable to fetch exchange rates');
};

const getExchangeRates = async () => {
  const now = Date.now();
  const cacheValid = ratesCache.rates && now - ratesCache.fetchedAt < CACHE_DURATION_MS;

  if (cacheValid) {
    return ratesCache.rates;
  }

  try {
    const rates = await fetchRatesFromApi();
    ratesCache = {
      rates,
      fetchedAt: now,
    };
    return rates;
  } catch (error) {
    if (ratesCache.rates) {
      return ratesCache.rates;
    }
    console.warn('Using fallback exchange rates:', error.message);
    ratesCache = {
      rates: FALLBACK_RATES,
      fetchedAt: now,
    };
    return ratesCache.rates;
  }
};

const convertPrice = async (amountInINR, targetCurrency = BASE_CURRENCY) => {
  const currency = normalizeCurrency(targetCurrency);
  const amount = Number(amountInINR);

  if (!Number.isFinite(amount)) return 0;
  if (currency === BASE_CURRENCY) return Number(amount.toFixed(2));

  const rates = await getExchangeRates();
  const converted = amount * rates[currency];
  return Number(converted.toFixed(2));
};

const convertToINR = async (amount, sourceCurrency = BASE_CURRENCY) => {
  const currency = normalizeCurrency(sourceCurrency);
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) return 0;
  if (currency === BASE_CURRENCY) return Number(numericAmount.toFixed(2));

  const rates = await getExchangeRates();
  const rate = rates[currency];
  const inrValue = numericAmount / rate;
  return Number(inrValue.toFixed(2));
};

module.exports = {
  BASE_CURRENCY,
  SUPPORTED_CURRENCIES,
  normalizeCurrency,
  getExchangeRates,
  convertPrice,
  convertToINR,
};
