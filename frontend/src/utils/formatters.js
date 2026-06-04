export function formatCurrency(amount, currency = 'LKR') {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactCurrency(amount) {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    currencyDisplay: 'code',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatNumber(num, decimals = 0) {
  return new Intl.NumberFormat('en-LK', {
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatPercent(value) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function tick() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

export function withTimeout(promise, ms, message = 'Operation timed out') {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
