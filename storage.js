// Local storage

const STORAGE_KEY_TRANSACTIONS = 'pocket-budget-transactions';

export function loadTransactions() {
  const data = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);

  if (!data) return [];

  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    console.error('Failed to parse transactions');
    return [];
  }
}

export function saveTransactions(transactions) {
  localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
}
