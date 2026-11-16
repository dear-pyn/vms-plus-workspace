/** Display only: discard excess decimal places without rounding or changing stored progress. */
export function truncateProgress(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.trunc(value * factor) / factor;
}
