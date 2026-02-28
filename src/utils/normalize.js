export function normalizeNumber(value, decimals = 12) {
  return (
    Math.round((value + Number.EPSILON) * 10 ** decimals) /
    10 ** decimals
  );
}
