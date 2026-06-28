'use strict';

// --- Constants & State ---
const STORAGE_KEY_TRANSACTIONS = 'pocket-budget-transactions';

const categories = {
  salary: { label: 'Salary', icon: '💼', color: '#5AA9E6' },
  gift: { label: 'Gift', icon: '🎁', color: '#F78CC6' },
  food: { label: 'Food', icon: '🍔', color: '#FD695A' },
  utilities: {
    label: 'Utilities',
    icon: '💡',
    color: '#FFC857',
  },
  transport: {
    label: 'Transport',
    icon: '🚃',
    color: '#4DB6E5',
  },
  entertainment: {
    label: 'Entertainment',
    icon: '🎥',
    color: '#8D7CF7',
  },
  housing: { label: 'Housing', icon: '🏠', color: '#5BCB95' },
};

// initial data
let transactions = [
  {
    id: 1,
    category: 'food',
    amount: -1200,
    date: '2024-03-01',
    note: 'Lunch',
  },
  {
    id: 2,
    category: 'salary',
    amount: 300000,
    date: '2024-03-25',
    note: 'Monthly salary',
  },
  {
    id: 3,
    category: 'utilities',
    amount: -15000,
    date: '2024-03-05',
    note: 'Electricity',
  },
  {
    id: 4,
    category: 'food',
    amount: -4500,
    date: '2024-03-10',
    note: 'Dinner',
  },
  { id: 5, category: 'transport', amount: -2000, date: '2024-03-12', note: '' },
  {
    id: 6,
    category: 'salary',
    amount: 5000,
    date: '2024-03-15',
    note: 'Bonus',
  },
];

// Format
const currencyFormatter = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const formatter = {
  currency(amount) {
    return currencyFormatter.format(amount);
  },
  date(date) {
    return dateFormatter.format(date);
  },
};

// --- Logic Functions ---
// Summary
function calculateTotals(transactions) {
  return transactions.reduce(
    (acc, { amount }) => {
      if (amount >= 0) {
        acc.income += amount;
      } else {
        acc.expense += Math.abs(amount);
      }

      return acc;
    },
    { income: 0, expense: 0 },
  );
}

// Category Aggregate
function calculateCategoryAggregate(transactions) {
  return transactions.reduce((acc, { category, amount }) => {
    if (amount >= 0) return acc;

    const absAmount = Math.abs(amount);
    return {
      ...acc,
      [category]: (acc[category] ?? 0) + absAmount,
    };

    // 💡 Alternative: when I need to pay attention of memory (Mutating)
    // acc[category] = (acc[category] ?? 0) + absAmount;
  }, {});
}

// Transaction id
function generateId() {
  return crypto.randomUUID();
}

// Current date
function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // month: 0 ~ 11
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// New transaction
function createTransaction(category, amount, note) {
  const categoryData = categories[category];

  if (!categoryData) {
    console.error('Invalid category is selected');
    return;
  }

  return {
    id: generateId(),
    category,
    amount: amount,
    date: getCurrentDate(),
    note,
  };
}

function validateAmount(amount) {
  let result = Number(amount);

  if (isNaN(result)) {
    alert('Please enter a valid number.');
    return null;
  }

  return result;
}

// ---  UI / Event Handlers ---

const currentBalanceEl = document.getElementById('current-balance');
const container = document.querySelector('.container');
const containerInput = document.querySelector('.container-input');
const incomeEl = document.getElementById('income');
const expenseEl = document.getElementById('expense');
const categoryChart = document.getElementById('chart-circle');
const categoryList = document.getElementById('category-list');
const recentListEL = document.getElementById('recent-list');
const transactionListEL = document.getElementById('transaction-list');

const form = document.getElementById('transaction-form');
const categorySelect = document.getElementById('category-select');
const noteInput = document.getElementById('note-input');
const amountInput = document.getElementById('amount-input');

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const amount = validateAmount(amountInput.value);
  if (!amount) return;

  const note = noteInput.value;
  if (!note.trim()) return;

  const selectedCategory = categorySelect.value;

  const newTransaction = createTransaction(selectedCategory, amount, note);

  setTransactions([...transactions, newTransaction]);
  clearInputs();
});

// Update
function setTransactions(newTransactions) {
  transactions = newTransactions;

  saveTransactions(newTransactions);

  renderTotals(newTransactions);
  renderCategory(newTransactions);
  renderTransactionList(newTransactions);
}

function renderTotals(transactions) {
  const { income, expense } = calculateTotals(transactions);

  currentBalanceEl.textContent = formatter.currency(income - expense);
  incomeEl.textContent = formatter.currency(income);
  expenseEl.textContent = formatter.currency(expense);
}

function renderCategory(transactions) {
  const { expense } = calculateTotals(transactions);
  const aggregate = calculateCategoryAggregate(transactions);

  createCategoryChart(expense, aggregate);
  createCategoryList(expense, aggregate);
}

function createCategoryChart(expense, aggregate) {
  let startDeg = 0;
  const gradients = Object.entries(aggregate).map(([key, value]) => {
    const color = categories[key].color;
    const angle = (value / expense) * 360;

    const result = `${color} ${startDeg}deg ${startDeg + angle}deg`;

    startDeg += angle;

    return result;
  });

  categoryChart.style.background = `
  conic-gradient(${gradients.join(',')})
  `;
}

function createCategoryList(expense, aggregate) {
  categoryList.replaceChildren();
  const exclusiveList = [];
  Object.entries(categories).forEach(([key, value]) => {
    const item = document.createElement('li');
    const { label, icon, color } = value;

    if (aggregate[key]) {
      const amount = aggregate[key];
      const percent = Math.trunc((amount / expense) * 100);
      item.innerHTML = `
      <p class="category-name">${icon} ${label}</p>
      <strong class="category-amount">${formatter.currency(amount)}</strong>
      <strong class="category-percent" style="background-color: ${hexToRgba(color, 0.18)}; color: ${color}">${percent}%</strong>
      `;

      categoryList.appendChild(item);
    } else {
      item.innerHTML = `
      <p class="category-name">${icon} ${label}</p>
      <strong class="category-amount">${formatter.currency(0)}</strong>
      <strong class="category-percent" style="background-color: ${hexToRgba(color, 0.18)}; color: ${color}">0%</strong>
      `;

      exclusiveList.push(item);
    }
  });

  if (exclusiveList.length > 0) {
    exclusiveList.forEach((item) => categoryList.appendChild(item));
  }
}

function renderTransactionList(transactions) {
  recentListEL.replaceChildren();
  transactionListEL.replaceChildren(); // or transactionListEL.innerHTML = ""

  transactions.forEach((transaction, index) => {
    if (index < 5) {
      recentListEL.appendChild(createRecentTransactionEl(transaction));
    }

    transactionListEL.appendChild(createTransactionEl(transaction));
  });
}

function createRecentTransactionEl(transaction) {
  const { category, note, amount } = transaction;
  const { label, icon } = categories[category];
  const date = new Date(transaction.date);

  const transactionEl = document.createElement('li');
  transactionEl.classList.add('transaction');
  transactionEl.innerHTML = `
  <p class="transaction-icon">${icon}</p>
    <div class="info">
      <p><strong>${label}</strong> ${note}</p>
      <small>${formatter.date(date)}</small>
    </div>
    <strong class="amount ${amount > 0 ? 'income' : 'expense'}">${formatter.currency(amount)}</strong>
  <button class="delete-btn">
    <i class="fas fa-trash"></i>
  </button>
  `;

  const deleteBtn = transactionEl.querySelector('button');
  deleteBtn.addEventListener('click', () => {
    deleteTransaction(transaction.id);
  });

  return transactionEl;
}

function createTransactionEl(transaction) {
  const { category, note, amount } = transaction;
  const date = new Date(transaction.date);
  const { label, color, icon } = categories[category];

  const transactionEl = document.createElement('li');
  transactionEl.classList.add('transaction', 'transaction-big');
  transactionEl.innerHTML = `
  <div class="transaction-label">
    <p class="transaction-date">MAY<br />25</p>
    <div class="transaction-icon-circle" style="background-color: ${hexToRgba(color, 0.4)}">
      <p class="transaction-icon">${icon}</p>
    </div>
    <div class="info">
      <p><strong>${label}</strong><br>${note}</p>
      <strong class="amount ${amount > 0 ? 'income' : 'expense'}">${formatter.currency(amount)}</strong>
    </div>
  </div>

  <button class="delete-btn">
    <i class="fas fa-trash"></i>
  </button>
  `;

  const deleteBtn = transactionEl.querySelector('button');
  deleteBtn.addEventListener('click', () => {
    deleteTransaction(transaction.id);
  });

  return transactionEl;
}

// Reference: https://stackoverflow.com/posts/28056903/revisions
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function clearInputs() {
  noteInput.value = '';
  amountInput.value = '';
}

function deleteTransaction(deleteId) {
  if (!confirm('Are you sure you want to delete this transaction?')) return;
  const filteredTransactions = transactions.filter(
    (transaction) => transaction.id !== deleteId,
  );
  setTransactions(filteredTransactions);
}

// --- Local storage ---
function loadTransactions() {
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

function saveTransactions(transactions) {
  localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
}

const localData = loadTransactions();
const initialTransactions = localData.length > 0 ? localData : transactions;

setTransactions(initialTransactions);
