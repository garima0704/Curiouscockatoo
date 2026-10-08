import Decimal from "decimal.js";

export function normalizeNumber(value, decimals = 12) {
  if (value == null) return null;

  try {
    const decimal = Decimal.isDecimal(value)
      ? value
      : new Decimal(String(value));

    return decimal.toDecimalPlaces(decimals).toNumber();
  } catch {
    return null;
  }
}

export function parseScientific(val) {
  if (val == null) return null;

  try {
    if (Decimal.isDecimal(val)) {
      return val;
    }

    if (typeof val === "object" && "mantissa" in val && "exponent" in val) {
      return new Decimal(String(val.mantissa)).mul(
        new Decimal(10).pow(val.exponent),
      );
    }

    return new Decimal(String(val));
  } catch {
    return null;
  }
}
