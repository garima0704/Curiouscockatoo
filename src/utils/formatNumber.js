import Decimal from "decimal.js";

const superscriptMap = {
  0: "⁰",
  1: "¹",
  2: "²",
  3: "³",
  4: "⁴",
  5: "⁵",
  6: "⁶",
  7: "⁷",
  8: "⁸",
  9: "⁹",
  "-": "⁻",
};

function toSuperscript(exp) {
  return exp
    .toString()
    .split("")
    .map((ch) => superscriptMap[ch] || ch)
    .join("");
}

function toSuperscriptString(exp) {
  return exp
    .toString()
    .split("")
    .map((ch) => superscriptMap[ch] || ch)
    .join("");
}

/**
 * Convert a value to Decimal without passing through JavaScript Number.
 */
function toDecimal(value) {
  if (value == null) return null;

  try {
    if (Decimal.isDecimal(value)) {
      return value;
    }

    return new Decimal(String(value));
  } catch {
    return null;
  }
}

/**
 * Convert a Decimal into a clean fixed-point decimal string.
 *
 * This intentionally does NOT use Number(), because Number loses
 * precision for very large and very small values.
 */
function cleanDecimal(value) {
  const decimal = toDecimal(value);

  if (!decimal || !decimal.isFinite()) return "...";

  if (decimal.isZero()) return "0";

  /*
   * Decimal.js keeps the value in arbitrary precision.
   * toFixed() without a decimal-place argument returns fixed-point
   * notation instead of scientific notation.
   */
  let result = decimal.toFixed();

  /*
   * Remove unnecessary trailing zeros after the decimal point.
   */
  if (result.includes(".")) {
    result = result.replace(/(\.\d*?)0+$/, "$1");
    result = result.replace(/\.$/, "");
  }

  /*
   * Avoid "-0".
   */
  if (result === "-0") return "0";

  return result;
}

function formatDecimalGroups(value, approx = false) {
  const decimal = toDecimal(value);

  if (!decimal || !decimal.isFinite()) return "...";

  if (decimal.isZero()) return "0";

  /*
   * Approximate values intentionally keep the existing behavior
   * of showing at most 9 decimal places.
   *
   * Decimal.js is still used here so large numbers do not lose
   * precision.
   */
  if (approx) {
    let result = decimal.toDecimalPlaces(9).toFixed();

    if (result.includes(".")) {
      result = result.replace(/(\.\d*?)0+$/, "$1");
      result = result.replace(/\.$/, "");
    }

    const [integerPart, decimalPart] = result.split(".");

    const sign = integerPart.startsWith("-") ? "-" : "";
    const unsignedInteger = sign
      ? integerPart.slice(1)
      : integerPart;

    const groupedInteger = unsignedInteger.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      ",",
    );

    return decimalPart
      ? `${sign}${groupedInteger}.${decimalPart}`
      : `${sign}${groupedInteger}`;
  }

  const cleaned = cleanDecimal(decimal);

  /*
   * Add thousands separators without converting the value back
   * into JavaScript Number.
   */
  const [integerPart, decimalPart] = cleaned.split(".");

  const sign = integerPart.startsWith("-") ? "-" : "";
  const unsignedInteger = sign
    ? integerPart.slice(1)
    : integerPart;

  const groupedInteger = unsignedInteger.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ",",
  );

  return decimalPart
    ? `${sign}${groupedInteger}.${decimalPart}`
    : `${sign}${groupedInteger}`;
}

// JSX version for in-component display
export function formatNumber(
  value,
  forceScientific = false,
  approx = false,
) {
  const decimal = toDecimal(value);

  if (!decimal || !decimal.isFinite()) return "...";

  if (forceScientific) {
    const [base, expRaw] = decimal.toExponential(2).split("e");
    const exp = expRaw.replace("+", "");

    return (
      <span className="inline-exponent">
        {base}&nbsp;×&nbsp;10
        <sup className="exponent-sup">{toSuperscript(exp)}</sup>
      </span>
    );
  }

  return formatDecimalGroups(decimal, approx);
}

// For dropdown or plain text
export function formatNumberString(
  value,
  forceScientific = false,
  approx = false,
) {
  const decimal = toDecimal(value);

  if (!decimal || !decimal.isFinite()) return "...";

  if (forceScientific) {
    const [base, expRaw] = decimal.toExponential(2).split("e");
    const exp = expRaw.replace("+", "");

    return `${base} × 10${toSuperscriptString(exp)}`;
  }

  return formatDecimalGroups(decimal, approx);
}

// Convert a string like "1e-12" to "1 × 10⁻¹²"
export function formatIfScientificString(value) {
  if (typeof value !== "string") return value;

  const sciMatch = value.match(/^([+-]?\d*\.?\d+)e([+-]?\d+)$/i);

  if (sciMatch) {
    const base = sciMatch[1];
    const exponent = sciMatch[2];

    return `${base} × 10${toSuperscriptString(exponent)}`;
  }

  return value;
}
