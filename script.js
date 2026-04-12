"use strict";

// --- Constants & State ---
const categoryLabels = {
  food: "Food",
  salary: "Salary",
  utilities: "Utilities",
  transport: "Transport",
};

// initial data
let transactions = [
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
  const month = String(now.getMonth() + 1).padStart(2, "0"); // month: 0 ~ 11
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// New transaction
function createTransaction(category, amount, note) {
  return {
    id: generateId(),
    category,
    amount,
    date: getCurrentDate(),
    note,
  };
}

// Transaction listitem
function createListItem({ category, note, amount }) {
  const label = categoryLabels[category] ?? category;
  return `[${label}] ${note || "No note"}: ${formatter.format(amount)}`;
}

// ---  UI / Event Handlers ---
const container = document.querySelector(".container");
const containerInput = document.querySelector(".container-input");
const incomeEl = document.getElementById("income");
const expenseEl = document.getElementById("expense");
const transactionListEL = document.getElementById("transaction-list");

const form = document.getElementById("transaction-form");
const categoryInput = document.getElementById("category-input");
const noteInput = document.getElementById("note-input");
const amountInput = document.getElementById("amount-input");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  // validation
  const amount = Number(amountInput.value);
  if (!amount) {
    alert("Please enter a number other than 0.");
    return;
  }

  const newTransaction = createTransaction(
    categoryInput.value,
    amount,
    noteInput.value,
  );

  setTransactions([...transactions, newTransaction]);
});

// Update
function setTransactions(newTransactions) {
  transactions = newTransactions;
  const { income, expense } = calculateTotals(newTransactions);

  renderTotals(income, expense);
  renderTransactionList(newTransactions);
  clearInputs();
}

function renderTotals(income, expense) {
  incomeEl.textContent = formatter.format(income);
  expenseEl.textContent = formatter.format(expense);
}

function renderTransactionList(transactions) {
  transactionListEL.replaceChildren(); // or transactionListEL.innerHTML = ""

  transactions.forEach((transaction) => {
    const listItem = document.createElement("li");
    listItem.classList.add("list-item");

    const textSpan = document.createElement("span");
    textSpan.textContent = createListItem(transaction);

    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = `<i class="fa-solid fa-trash"></i>`;
    deleteBtn.classList.add("delete-btn");

    deleteBtn.addEventListener("click", () => {
      deleteTransaction(transaction.id);
    });

    listItem.appendChild(textSpan);
    listItem.appendChild(deleteBtn);

    transactionListEL.appendChild(listItem);
  });
}

function clearInputs() {
  categoryInput.value = "";
  noteInput.value = "";
  amountInput.value = "";
}

function deleteTransaction(deleteId) {
  if (!confirm("Are you sure you want to delete this transaction?")) return;
  const filteredTransactions = transactions.filter(
    (transaction) => transaction.id !== deleteId,
  );
  setTransactions(filteredTransactions);
}

setTransactions(transactions);
