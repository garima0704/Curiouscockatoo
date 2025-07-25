const superscriptMap = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "-": "⁻"
};

function toSuperscript(exp) {
  return exp
    .split("")
    .map((ch) => superscriptMap[ch] || ch)
    .join("");
}

function toSuperscriptString(exp) {
  return exp
    .split("")
    .map((ch) => superscriptMap[ch] || ch)
    .join("");
}

// JSX version - for display with superscript tag
export function formatNumber(value, forceScientific = false, approx = false) {
  if (value == null || isNaN(value)) return "...";

  const absVal = Math.abs(value);

  const shouldUseScientific = forceScientific || absVal >= 1e6 || absVal < 0.001;

  if (shouldUseScientific) {
    const [base, expRaw] = Number(value).toExponential(2).split("e");
    const exp = expRaw.replace("+", "");
    return (
      <>
        {base} × 10<sup style={{ fontSize: "1.1em" }}>{toSuperscript(exp)}</sup>
      </>
    );
  }

  return approx
    ? Number(value).toLocaleString(undefined, { maximumFractionDigits: 6 })
    : Number(value).toLocaleString();
}

// String version - for dropdown options and plain text contexts
export function formatNumberString(value, forceScientific = false, approx = false) {
  if (value == null || isNaN(value)) return "...";

  const absVal = Math.abs(value);

  const shouldUseScientific = forceScientific || absVal >= 1e6 || absVal < 0.001;

  if (shouldUseScientific) {
    const [base, expRaw] = Number(value).toExponential(2).split("e");
    const exp = expRaw.replace("+", "");
    return `${base} × 10${toSuperscriptString(exp)}`;
  }

  return approx
    ? Number(value).toLocaleString(undefined, { maximumFractionDigits: 6 })
    : Number(value).toLocaleString();
}
