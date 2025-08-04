import React from "react";
import { formatNumber } from "../utils/formatNumber";
import { parseScientific } from "../utils/parseScientific";

function cleanHTMLNotes(html) {
  if (!html) return "";
  return html
    .replace(/<p[^>]*>(\s|&nbsp;)*<\/p>/gi, "")
    .replace(/<div[^>]*>(\s|&nbsp;)*<\/div>/gi, "")
    .replace(/<br\s*\/?>/gi, "")
    .trim();
}

function RealWorldBox({
  selected,
  setSelected,
  items = [],
  scientificToggle = true,
}) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div
      className="pr-1 flex flex-col gap-3 overflow-y-auto"
      style={{ overflowX: "hidden" }}
    >
      {/* Top gradient spacers */}
      <div className="h-6 bg-gray-300 rounded opacity-70" />
      <div className="h-6 bg-gray-200 rounded opacity-70" />
      <div className="h-6 bg-gray-100 rounded opacity-70" />

      {/* Real-world items */}
      {safeItems.map((item, index) => {
        // Blank item rendering
        if (item.type === "blank") {
          return (
            <div
              key={`blank-${item.power}-${index}`}
              className="bg-gray-100 border border-dashed border-gray-300 p-4 rounded text-center text-gray-700 font-mono text-base min-h-[80px] flex items-center justify-center"
            >
              10<sup>{item.power}</sup>
            </div>
          );
        }

        // Real item rendering
        const isSelected = selected?.id === item.id;
        const isInfinite = item.expression?.toLowerCase().includes("infin");
        const parsedScientific = parseScientific(item.scientific_value);
        const parsedScientificValue =
          typeof parsedScientific === "number" ? parsedScientific : null;

        const parsedApprox = item.approx_value;

        const displayValue = item.expression ? (
          <span dangerouslySetInnerHTML={{ __html: item.expression }} />
        ) : item.approx_value != null ? (
          <>
            {formatNumber(
              item.approx_value,
              String(item.approx_value).includes("e"), // only scientific if needed
              true,
            )}{" "}
            <span className="unit-symbol">{item?.expand?.unit?.symbol || ""}</span>
          </>
        ) : item.scientific_value != null ? (
          <>
            {formatNumber(item.scientific_value, scientificToggle)}{" "}
            <span className="unit-symbol">{item?.expand?.unit?.symbol}</span>
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
            className={`cursor-pointer border pt-3 pb-1 px-3 rounded shadow-sm w-full max-w-full overflow-visible ${
              isSelected
                ? "bg-blue-50 border-blue-400"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            <div className="font-semibold text-blue-800 text-center text-sm md:text-base">
              {item.name}
            </div>

            <div className="mt-2 text-center text-blue-600 font-mono text-sm md:text-base break-all leading-[2] py-2 overflow-visible">
              {displayValue}
            </div>

            {item.notes && (
              <div
                className="prose prose-sm max-w-none text-left text-gray-600 mt-2 [&_p]:my-1 [&_ul]:my-1 [&_li]:my-1 [&> :last-child]:mb-0"
                dangerouslySetInnerHTML={{ __html: cleanHTMLNotes(item.notes) }}
              />
            )}
          </div>
        );
      })}

      {/* Bottom gradient spacers */}
      <div className="h-6 bg-gray-100 rounded opacity-70" />
      <div className="h-6 bg-gray-200 rounded opacity-70" />
      <div className="h-6 bg-gray-300 rounded opacity-70" />
    </div>
  );
}

export default RealWorldBox;
