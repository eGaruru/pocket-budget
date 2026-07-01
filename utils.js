// Utils

// Generate id
export function generateId() {
  return crypto.randomUUID();
}

// Current date
export function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // month: 0 ~ 11
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// Reference: https://stackoverflow.com/posts/28056903/revisions
export function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
