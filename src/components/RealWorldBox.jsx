import React from "react";
import { useTranslation } from "react-i18next";
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
  const { i18n } = useTranslation();
  const lang = i18n?.language || "en";

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
        // Blank item rendering: use either power or exponent as fallback
        if (item.type === "blank") {
          const powerVal = item.power ?? item.exponent ?? 0;
          return (
            <div
              key={`blank-${powerVal}-${index}`}
              className="bg-gray-100 border border-dashed border-gray-300 p-4 rounded text-center text-gray-700 font-mono text-base min-h-[80px] flex items-center justify-center"
            >
              10<sup>{powerVal}</sup>
            </div>
          );
        }

        // Localized name / notes / expression
        const name =
          lang === "es"
            ? item.name_es || item.name_en || item.name || ""
            : item.name_en || item.name_es || item.name || "";

        const notesLocalized =
          lang === "es"
            ? item.notes_es || item.notes_en || item.notes || ""
            : item.notes_en || item.notes || "";

        const localizedExpression =
          lang === "es"
            ? item.expression_es || item.expression_en || item.expression || ""
            : item.expression_en || item.expression_es || item.expression || "";

        const isSelected = selected?.id === item.id;

        // Check for "infinite" using localized expression (if any)
        const isInfinite =
          typeof localizedExpression === "string" &&
          localizedExpression.toLowerCase().includes("infin");

        // Choose display value (prefer localized expression, then approx, then scientific)
        const unitSymbol = (item?.expand?.unit?.symbol || "").toString();

        const approxNumeric = item?.approx_value != null ? parseFloat(item.approx_value) : null;
        const sciNumeric = (() => {
          // try parseScientific for better handling, otherwise parseFloat
          try {
            const p = parseScientific(item?.scientific_value);
            if (typeof p === "number" && isFinite(p)) return p;
          } catch (e) {
            // ignore
          }
          const s = item?.scientific_value;
          return s != null && s !== "" ? parseFloat(s) : null;
        })();

        const displayValue = localizedExpression ? (
          <span dangerouslySetInnerHTML={{ __html: localizedExpression }} />
        ) : approxNumeric != null && !isNaN(approxNumeric) ? (
          <>
            {formatNumber(approxNumeric, String(item.approx_value).includes("e"), true)}{" "}
            <span className="unit-symbol">{unitSymbol}</span>
          </>
        ) : sciNumeric != null && !isNaN(sciNumeric) ? (
          <>
            {formatNumber(sciNumeric, scientificToggle)} <span className="unit-symbol">{unitSymbol}</span>
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
              isSelected ? "bg-blue-50 border-blue-400" : "bg-white hover:bg-gray-50"
            }`}
          >
            <div className="font-semibold text-blue-800 text-center text-sm md:text-base">{name}</div>

            <div className="mt-2 text-center text-blue-600 font-mono text-sm md:text-base break-all leading-[2] py-2 overflow-visible">
              {displayValue}
            </div>

            {notesLocalized && (
              <div
                className="prose prose-sm max-w-none text-left text-gray-600 mt-2 [&_p]:my-1 [&_ul]:my-1 [&_li]:my-1 [&> :last-child]:mb-0"
                dangerouslySetInnerHTML={{ __html: cleanHTMLNotes(notesLocalized) }}
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
