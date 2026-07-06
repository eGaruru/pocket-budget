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

export const formatter = {
  currency(amount) {
    return currencyFormatter.format(amount);
  },
  date(date) {
    return dateFormatter.format(date);
  },
};
