/**
 * Simple zone-based shipping fee calculation for Hanoi only (no third-party API)
 * @param {string} addressTo - delivery address
 * @param {number} totalAmount - order total
 * @returns {number} shipping fee (VND), -1 if not supported
 */
function calculateShippingFee(addressTo = '', totalAmount = 0) {
  // Only ship in Hanoi
  const isHaNoi = typeof addressTo === 'string' && addressTo.toLowerCase().includes('hà nội');
  if (!isHaNoi) return -1;
  if (totalAmount >= 1000000) return 0;
  // Simple static fee for all Hanoi
  return 20000;
}

/**
 * Main function: takes address and total, returns shipping fee (Hanoi only)
 * @param {Object} param0
 * @param {string} param0.shippingAddress - delivery address
 * @param {number} param0.totalAmount - order total
 * @returns {number} shipping fee or -1 if not Hanoi
 */
function getShippingFeeForOrder({ shippingAddress, totalAmount }) {
  return calculateShippingFee(shippingAddress, totalAmount);
}

export {
  calculateShippingFee,
  getShippingFeeForOrder,
};
