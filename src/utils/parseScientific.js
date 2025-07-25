export function parseScientific(val) {
  if (val == null) return null;
  if (typeof val === "number") return val;

  if (typeof val === "object" && "mantissa" in val && "exponent" in val) {
    return val.mantissa * Math.pow(10, val.exponent);
  }

  const num = Number(val);
  return isNaN(num) ? null : num;
}
