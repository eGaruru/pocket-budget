"use strict";

// --- Constants & State ---
const categoryLabels = {
  food: "Food",
  salary: "Salary",
  utilities: "Utilities",
  transport: "Transport",
};

// initial data
const transactions = [
  {
    id: 1,
    category: "food",
    amount: -1200,
    date: "2024-03-01",
    note: "Lunch",
  },
  {
    id: 2,
    category: "salary",
    amount: 300000,
    date: "2024-03-25",
    note: "Monthly salary",
  },
  {
    id: 3,
    category: "utilities",
    amount: -15000,
    date: "2024-03-05",
    note: "Electricity",
  },
  {
    id: 4,
    category: "food",
    amount: -4500,
    date: "2024-03-10",
    note: "Dinner",
  },
  { id: 5, category: "transport", amount: -2000, date: "2024-03-12", note: "" },
  {
    id: 6,
    category: "salary",
    amount: 5000,
    date: "2024-03-15",
    note: "Bonus",
  },
];

// Format into currency
const formatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
});

// --- Logic Functions ---
// Summary
const { income, expense } = transactions.reduce(
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

// Transaction list
const transactionList = transactions.map(({ category, note, amount }) => {
  const label = categoryLabels[category] ?? category;
  return `[${label}] ${note || "No note"}: ${formatter.format(amount)}`;
});

// Category Aggregate
const categoryAggregate = transactions.reduce((acc, { category, amount }) => {
  if (amount >= 0) return acc;

  const absAmount = Math.abs(amount);
  return {
    ...acc,
    [category]: (acc[category] ?? 0) + absAmount,
  };

  // 💡 Alternative: when I need to pay attention of memory (Mutating)
  // acc[category] = (acc[category] ?? 0) + absAmount;
}, {});

// ---  UI Rendering Functions ---
const container = document.querySelector(".container");
const containerInput = document.querySelector(".container-input");
const incomeEl = document.getElementById("income");
const expenseEl = document.getElementById("expense");
const transactionListEL = document.getElementById("transaction-list");

function renderTotals(income, expense) {
  incomeEl.textContent = formatter.format(income);
  expenseEl.textContent = formatter.format(expense);
}

function renderTransactionList(transactionList) {
  transactionListEL.replaceChildren(); // or transactionListEL.innerHTML = ""
  transactionList.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    listItem.classList.add("list-item");
    transactionListEL.appendChild(listItem);
  });
}

renderTotals(income, expense);
renderTransactionList(transactionList);
