/**
 * Innmotek V2 - Date Formatting Helper
 * 
 * Replaces Laravel's Carbon format('d M, Y') pattern (e.g. "15 Jun, 2024").
 */

/**
 * Format a date string or timestamp to "DD MMM, YYYY" (e.g., "05 Dec, 2023").
 * 
 * @param {string|Date|null} dateVal - Input date value
 * @returns {string} Formatted date string or empty string if invalid
 */
function formatDate(dateVal) {
  if (!dateVal) return '';
  
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) {
    return String(dateVal);
  }

  const day = String(d.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${month}, ${year}`;
}

module.exports = {
  formatDate
};
