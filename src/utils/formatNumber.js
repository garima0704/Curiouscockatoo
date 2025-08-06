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

  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: approx ? 6 : 20,
    minimumFractionDigits: 0,
  });
}

// For dropdown or plain text
export function formatNumberString(
  value,
  forceScientific = false,
  approx = false,
) {
  if (value == null) return "...";

  const num = Number(value);
  if (isNaN(num)) return "...";

  if (forceScientific) {
    const [base, expRaw] = num.toExponential(2).split("e");
    const exp = expRaw.replace("+", "");
    return `${base} × 10${toSuperscriptString(exp)}`;
  }

  return num.toLocaleString(undefined, {
    maximumFractionDigits: approx ? 6 : 20,
    minimumFractionDigits: 0,
  });
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
