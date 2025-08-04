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

// JSX version for in-component display
export function formatNumber(value, forceScientific = false, approx = false) {
  if (value == null || isNaN(value)) return "...";

  const absVal = Math.abs(value);

  // Use scientific format only if toggle is ON
  if (forceScientific) {
    const [base, expRaw] = Number(value).toExponential(2).split("e");
    const exp = expRaw.replace("+", "");
    return (
      <span className="inline-exponent">
        {base}&nbsp;×&nbsp;10
        <sup className="exponent-sup">{toSuperscript(exp)}</sup>
      </span>
    );
  }

  // Normal (general) number formatting
  return approx
    ? Number(value).toLocaleString(undefined, { maximumFractionDigits: 6 })
    : Number(value).toLocaleString();
}


// For dropdown or plain text
export function formatNumberString(
  value,
  forceScientific = false,
  approx = false,
) {
  if (value == null) return "...";

  const num = Number(value);
  const absVal = Math.abs(num);

  const shouldUseScientific = forceScientific;

  if (shouldUseScientific) {
    const [base, expRaw] = num.toExponential(2).split("e");
    const exp = expRaw.replace("+", "");
    return `${base} × 10${toSuperscriptString(exp)}`;
  }

  // Return normal format
  return approx
    ? num.toLocaleString(undefined, { maximumFractionDigits: 6 })
    : num.toLocaleString();
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
