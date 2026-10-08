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
 * Convert a JavaScript number into a clean decimal string.
 */
function cleanFloatingPoint(value) {
  const num = Number(value);

  if (!Number.isFinite(num)) return "...";

  if (num === 0) return "0";

  /*
   * For integers, don't run through a limited-precision exponential representation.
   */
  if (Number.isInteger(num)) {
    return num.toLocaleString("en-US", {
      useGrouping: false,
      maximumFractionDigits: 0,
    });
  }

  /*
   * For decimal values, use enough significant digits to preserveuseful precision without exposing the tiny floating-point tail.
   */
  const scientific = num.toExponential(21);
  const [coefficient, exponentString] = scientific.split("e");

  const exponent = Number(exponentString);

  // Remove trailing zeros from the coefficient.
  const cleanCoefficient = coefficient.replace(/\.?0+$/, "");

  const [integerPart, decimalPart = ""] = cleanCoefficient.split(".");
  const digits = integerPart + decimalPart;

  const decimalPosition = 1 + exponent;

  let result;

  if (decimalPosition <= 0) {
    result = `0.${"0".repeat(-decimalPosition)}${digits}`;
  } else if (decimalPosition >= digits.length) {
    result = digits + "0".repeat(decimalPosition - digits.length);
  } else {
    result =
      digits.slice(0, decimalPosition) +
      "." +
      digits.slice(decimalPosition);
  }

  /*
   * Remove unnecessary trailing zeros after the decimal point.
   */
  result = result.replace(/(\.\d*?)0+$/, "$1");
  result = result.replace(/\.$/, "");

  /*
   * Avoid "-0".
   */
  if (result === "-0") return "0";

  return result;
}

function formatDecimalGroups(value, approx = false) {
  const num = Number(value);

  if (!Number.isFinite(num)) return "...";

  /*
   * Approximate values intentionally use the existing 9-decimal
   * behavior.
   */
  if (approx) {
    return num.toLocaleString("en-US", {
      maximumFractionDigits: 9,
      minimumFractionDigits: 0,
      useGrouping: true,
    });
  }

  const cleaned = cleanFloatingPoint(num);

  /*
   * Add thousands separators without converting the value back into Number.
   */
  const [integerPart, decimalPart] = cleaned.split(".");

  const sign = integerPart.startsWith("-") ? "-" : "";
  const unsignedInteger = sign ? integerPart.slice(1) : integerPart;

  const groupedInteger = unsignedInteger.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ",",
  );

  return decimalPart
    ? `${sign}${groupedInteger}.${decimalPart}`
    : `${sign}${groupedInteger}`;
}

// JSX version for in-component display
export function formatNumber(value, forceScientific = false, approx = false) {
  if (value == null || !Number.isFinite(Number(value))) return "...";

  const num = Number(value);

  if (forceScientific) {
    const [base, expRaw] = num.toExponential(2).split("e");
    const exp = expRaw.replace("+", "");

    return (
      <span className="inline-exponent">
        {base}&nbsp;×&nbsp;10
        <sup className="exponent-sup">{toSuperscript(exp)}</sup>
      </span>
    );
  }

  return formatDecimalGroups(num, approx);
}

// For dropdown or plain text
export function formatNumberString(
  value,
  forceScientific = false,
  approx = false,
) {
  if (value == null || !Number.isFinite(Number(value))) return "...";

  const num = Number(value);

  if (forceScientific) {
    const [base, expRaw] = num.toExponential(2).split("e");
    const exp = expRaw.replace("+", "");

    return `${base} × 10${toSuperscriptString(exp)}`;
  }

  return formatDecimalGroups(num, approx);
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
