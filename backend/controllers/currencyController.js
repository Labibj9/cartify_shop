const {
  BASE_CURRENCY,
  SUPPORTED_CURRENCIES,
  getExchangeRates,
  normalizeCurrency,
} = require('../services/currencyService');

exports.getRates = async (req, res) => {
  try {
    const requestedBase = normalizeCurrency(req.query.base || BASE_CURRENCY);
    const rates = await getExchangeRates();

    if (requestedBase === BASE_CURRENCY) {
      return res.json({
        success: true,
        base: BASE_CURRENCY,
        supportedCurrencies: SUPPORTED_CURRENCIES,
        rates,
      });
    }

    const baseRate = rates[requestedBase];
    const rebasedRates = SUPPORTED_CURRENCIES.reduce((acc, currency) => {
      acc[currency] = Number((rates[currency] / baseRate).toFixed(6));
      return acc;
    }, {});

    return res.json({
      success: true,
      base: requestedBase,
      supportedCurrencies: SUPPORTED_CURRENCIES,
      rates: rebasedRates,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
