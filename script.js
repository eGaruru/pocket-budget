'use strict';
import { categories } from './categories.js';
import { dummyTransactions } from './dummy-data.js';
import { formatter } from './formatter.js';
import { loadTransactions, saveTransactions } from './storage.js';
import { generateId, getCurrentDate, hexToRgba } from './utils.js';

// --- Constants & State ---
const RECENT_TRANSACTION_COUNT = 5;

const sortType = {
  dateDesc: 'date-desc',
  dateAsc: 'date-asc',
  amountDesc: 'amount-desc',
  amountAsc: 'amount-asc',
};

// --- Logic Functions ---
let transactions;
let currentFilter = 'all';
let currentSort = sortType.dateDesc;

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

// New transaction
function createTransaction(category, amount, title) {
  if (!categories[category]) {
    console.error('Invalid category is selected');
    return;
  }

  return {
    id: generateId(),
    category,
    amount: amount,
    date: getCurrentDate(),
    title,
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
const innerChart = document.getElementById('inner-circle');
const categoryList = document.getElementById('category-list');
const recentListEL = document.getElementById('recent-list');
const transactionListEL = document.getElementById('transaction-list');

const allBtn = document.getElementById('all-btn');
const incomeBtn = document.getElementById('income-btn');
const expenseBtn = document.getElementById('expense-btn');
const sortSelect = document.getElementById('sort-select');

const form = document.getElementById('transaction-form');
const categorySelect = document.getElementById('category-select');
const titleInput = document.getElementById('title-input');
const amountInput = document.getElementById('amount-input');
const clearBtn = document.getElementById('clear-btn');

allBtn.addEventListener('click', () => setFilter('all'));
incomeBtn.addEventListener('click', () => setFilter('income'));
expenseBtn.addEventListener('click', () => setFilter('expense'));
sortSelect.addEventListener('change', (e) => setSort(e.target.value));

function setSort(sort) {
  currentSort = sortType[sort];
  renderTransactionList(getDisplayTransactions());
}

function setFilter(filter) {
  currentFilter = filter;
  renderTransactionList(getDisplayTransactions());
}

function getDisplayTransactions() {
  return getSortedTransactions(getFilteredTransactions(), currentSort);
}

function getFilteredTransactions() {
  if (currentFilter === 'income') {
    return transactions.filter((transaction) => transaction.amount > 0);
  } else if (currentFilter === 'expense') {
    return transactions.filter((transaction) => transaction.amount < 0);
  } else {
    return transactions;
  }
}

function getSortedTransactions(transactions, sort) {
  const copied = [...transactions];

  switch (sort) {
    case sortType.dateDesc:
      return copied.sort((a, b) => new Date(b.date) - new Date(a.date));
    case sortType.dateAsc:
      return copied.sort((a, b) => new Date(a.date) - new Date(b.date));
    case sortType.amountDesc:
      return copied.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    case sortType.amountAsc:
      return copied.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));
    default:
      return copied;
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const amount = validateAmount(amountInput.value);
  if (!amount) return;

  const title = titleInput.value;
  if (!title.trim()) return;

  const selectedCategory = categorySelect.value;

  const newTransaction = createTransaction(selectedCategory, amount, title);

  setTransactions([...transactions, newTransaction]);
  clearInputs();
});

categorySelect.addEventListener('change', (e) => {
  if (e.target.value !== '') {
    categorySelect.classList.remove('placeholder');
  }
});

clearBtn.addEventListener('click', (e) => {
  e.preventDefault();
  clearInputs();
});

// Update
function setTransactions(newTransactions) {
  transactions = newTransactions;

  saveTransactions(transactions);

  renderDashboard(transactions);
}

function renderDashboard(transactions) {
  renderTotals(transactions);
  renderCategory(transactions);
  renderRecentTransactions(
    getSortedTransactions(transactions, sortType.dateDesc),
  );
  renderTransactionList(getDisplayTransactions());
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

  innerChart.innerHTML = `
    <span>${formatter.currency(expense)}</span>
    <small>Total</small>`;

  if (expense === 0) {
    categoryChart.style.background = 'var(--color-border-form)';
    return;
  }

  const gradients = Object.entries(aggregate).map(([key, value]) => {
    const color = categories[key].color;
    const angle = Math.round((value / expense) * 360);
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

  if (expense === 0) {
    const item = document.createElement('li');
    item.innerHTML = '<p>No expense yet.</p>';
    categoryList.appendChild(item);
    return;
  }

  Object.entries(categories).forEach(([key, value]) => {
    const item = document.createElement('li');
    const { label, icon, color } = value;

    const amount = aggregate[key] ?? 0;
    const percent = Math.round((amount / expense) * 100);

    item.innerHTML = `
      <p class="category-name">${icon} ${label}</p>
      <strong class="category-amount">${formatter.currency(amount)}</strong>
      <strong class="category-percent" style="background-color: ${hexToRgba(color, 0.18)}; color: ${color}">${percent}%</strong>
      `;

    if (aggregate[key]) {
      categoryList.appendChild(item);
    } else {
      exclusiveList.push(item);
    }
  });

  if (exclusiveList.length > 0) {
    exclusiveList.forEach((item) => categoryList.appendChild(item));
  }
}

function renderRecentTransactions(transactions) {
  recentListEL.replaceChildren();

  transactions
    .slice(0, RECENT_TRANSACTION_COUNT)
    .forEach((transaction) =>
      recentListEL.appendChild(createRecentTransactionEl(transaction)),
    );
}

function renderTransactionList(transactions) {
  transactionListEL.replaceChildren(); // or transactionListEL.innerHTML = ""

  transactions.forEach((transaction) =>
    transactionListEL.appendChild(createTransactionEl(transaction)),
  );
}

function createRecentTransactionEl(transaction) {
  const { id, category, title, amount, date, label, icon } =
    getDisplayTransactionData(transaction);

  const transactionEl = document.createElement('li');
  transactionEl.classList.add('transaction');
  transactionEl.innerHTML = `
  <p class="transaction-icon">${icon}</p>
    <div class="info">
      <p><strong>${label}</strong> ${title}</p>
      <small>${formatter.date(date)}</small>
    </div>
    <strong class="amount ${amount > 0 ? 'income' : 'expense'}">${formatter.currency(amount)}</strong>
  `;

  transactionEl.appendChild(createDeleteBtn(id));

  return transactionEl;
}

function createTransactionEl(transaction) {
  const { id, category, title, amount, date, label, icon, color } =
    getDisplayTransactionData(transaction);

  const month = formatter.date(date).slice(0, 3).toUpperCase();
  const day = date.getDate();

  const transactionEl = document.createElement('li');
  transactionEl.classList.add('transaction', 'transaction-big');
  transactionEl.innerHTML = `
  <div class="transaction-label">
    <p class="transaction-date">${month}<br />${day}</p>
    <div class="transaction-icon-circle" style="background-color: ${hexToRgba(color, 0.4)}">
      <p class="transaction-icon">${icon}</p>
    </div>
    <div class="info">
      <p><strong>${label}</strong><br>${title}</p>
      <strong class="amount ${amount > 0 ? 'income' : 'expense'}">${formatter.currency(amount)}</strong>
    </div>
  </div>
  `;

  transactionEl.appendChild(createDeleteBtn(id));

  return transactionEl;
}

function getDisplayTransactionData(transaction) {
  const { id, title, category, amount } = transaction;
  const date = new Date(transaction.date);

  return {
    id,
    title,
    category,
    amount,
    date,
    ...categories[category],
  };
}

function createDeleteBtn(transactionId) {
  const btn = document.createElement('button');
  btn.classList.add('delete-btn');
  btn.innerHTML = `<i class="fas fa-trash"></i>`;

  btn.addEventListener('click', () => deleteTransaction(transactionId));

  return btn;
}

function clearInputs() {
  titleInput.value = '';
  categorySelect.value = '';
  categorySelect.classList.add('placeholder');
  amountInput.value = '';
}

function deleteTransaction(deleteId) {
  if (!confirm('Are you sure you want to delete this transaction?')) return;
  const filteredTransactions = transactions.filter(
    (transaction) => transaction.id !== deleteId,
  );
  setTransactions(filteredTransactions);
}

const localData = loadTransactions();
const initialTransactions =
  localData.length > 0 ? localData : dummyTransactions;

setTransactions(initialTransactions);
