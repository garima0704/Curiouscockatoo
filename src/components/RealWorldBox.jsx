import React from "react";
import { formatNumber } from "../utils/formatNumber";

// Helper to parse scientific_value safely
function parseScientific(val) {
  if (val == null) return null;
  if (typeof val === "number") return val;

  if (typeof val === "object" && "mantissa" in val && "exponent" in val) {
    return val.mantissa * Math.pow(10, val.exponent);
  }

  const num = Number(val);
  return isNaN(num) ? null : num;
}

function RealWorldBox({ selected, setSelected, items = [], scientificToggle = true }) {
  const safeItems = Array.isArray(items) ? items : [];

  const sortedItems = [...safeItems].sort((a, b) => {
    const isAInfinite = a.expression?.toLowerCase().includes("infin");
    const isBInfinite = b.expression?.toLowerCase().includes("infin");

    // Push items with 'infinite' expressions to the end
    if (isAInfinite && !isBInfinite) return 1;
    if (!isAInfinite && isBInfinite) return -1;
    if (isAInfinite && isBInfinite) return 0;

    const aVal = parseScientific(a.scientific_value);
    const bVal = parseScientific(b.scientific_value);

    // Items with invalid scientific values go last
    if (aVal == null || isNaN(aVal)) return 1;
    if (bVal == null || isNaN(bVal)) return -1;

    return aVal - bVal;
  });

  return (
    <div className="overflow-y-auto max-h-[300px] pr-1 flex flex-col gap-3" style={{ overflowX: "hidden" }}>
      {sortedItems.map((item) => {
        const isSelected = selected?.id === item.id;
        const isInfinite = item.expression?.toLowerCase().includes("infin");
        const parsedScientific = parseScientific(item.scientific_value);
        const parsedApprox = item.approx_value;

        // Display Value (Scientific or Approx, fallback to expression)
        const displayValue = item.expression ? (
          <span dangerouslySetInnerHTML={{ __html: item.expression }} />
        ) : scientificToggle ? (
          parsedScientific != null ? (
            formatNumber(parsedScientific, true)
          ) : (
            "..."
          )
        ) : parsedApprox != null ? (
          <>
            {formatNumber(parsedApprox, false, true)} {item?.expand?.unit?.symbol || ""}
          </>
        ) : (
          "..."
        );

        return (
          <div
            key={item.id}
            onClick={() => setSelected?.(item)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setSelected?.(item);
            }}
            className={`cursor-pointer border p-3 rounded shadow-sm ${
              isSelected ? "bg-blue-50 border-blue-400" : "bg-white"
            }`}
          >
            {/* Name */}
            <div className="font-semibold text-blue-800 text-center">{item.name}</div>

            {/* Values row */}
            <div className="text-sm mt-1 flex justify-between text-blue-600 font-mono">
              {/* Scientific value (always shows if valid, else Infinite) */}
              <span>
                {isInfinite
                  ? "Infinite"
                  : parsedScientific != null
                  ? formatNumber(parsedScientific, true)
                  : "..."}
              </span>

              {/* Displayed Approx or Expression */}
              <span>{displayValue}</span>
            </div>

            {/* Notes */}
            {item.notes && (
              <div
                className="prose max-w-none text-xs text-gray-500 italic mt-2 text-center"
                dangerouslySetInnerHTML={{ __html: item.notes }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default RealWorldBox;
