// Local storage
const STORAGE_KEY = {
  TRANSACTIONS: 'pocket-budget-transactions',
};

export function loadTransactions() {
  return loadFromLS(STORAGE_KEY.TRANSACTIONS, []);
}

export function saveTransactions(transactions) {
  saveToLS(STORAGE_KEY.TRANSACTIONS, transactions);
}

function loadFromLS(key, defaultValue) {
  const data = localStorage.getItem(key);

  if (!data) return defaultValue;

  try {
    return JSON.parse(data);
  } catch {
    console.error(`Failed to parse localStorage: ${key}`);
    return defaultValue;
  }
}

function saveToLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
