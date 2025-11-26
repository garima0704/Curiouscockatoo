import React, { useEffect, useState } from "react";
import pb from "../utils/pocketbaseClient";
import { formatNumber } from "../utils/formatNumber";
import { useTheme } from "../context/ThemeContext";
import FooterNote from "./FooterNote";
import { useTranslation } from "react-i18next";


function MoleConverter({ categoryId, lang }) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const activeLang = lang || i18n.language || "en";
  const primaryColor = theme?.primary || "#feb73f";

  const [units, setUnits] = useState([]);
  const [inputValues, setInputValues] = useState(["", "", ""]);
  const [selectedUnits, setSelectedUnits] = useState([null, null, null]);
  const [realWorldItems, setRealWorldItems] = useState([[], [], []]);
  const [selectedItems, setSelectedItems] = useState([null, null, null]);
  const [comparisonToggles, setComparisonToggles] = useState([
    false,
    false,
    false,
  ]);
/** -------------------------------------------------
   *  FETCH UNITS
   * ------------------------------------------------- */
  useEffect(() => {
  const fetchUnits = async () => {
    const records = await pb.collection("units").getFullList({
      filter: `category = "${categoryId}"`,
    });

    // LOCALIZE UNITS
    const localizedUnits = records.map((u) => ({
      ...u,
      name:
        activeLang === "es"
          ? u.name_es || u.name_en
          : u.name_en || u.name_es,
      notes:
        activeLang === "es"
          ? u.notes_es || u.notes_en
          : u.notes_en || u.notes_es,
      symbol:
        activeLang === "es"
          ? u.symbol_es || u.symbol_en
          : u.symbol_en || u.symbol_es,
    }));

    setUnits(localizedUnits);
    setSelectedUnits([
      localizedUnits[0]?.id,
      localizedUnits[1]?.id,
      localizedUnits[2]?.id,
    ]);
  };

  fetchUnits();
}, [categoryId, activeLang]);

/** -------------------------------------------------
   *  FETCH REALWORLD ITEMS
   * ------------------------------------------------- */

 useEffect(() => {
  const fetchRealWorldItems = async () => {
    try {
      const results = await Promise.all(
        selectedUnits.map((unitId) =>
          pb.collection("realworld_items").getFullList({
            filter: `unit = "${unitId}"`,
            sort: "approx_value",
          })
        )
      );

      // LOCALIZE ITEMS
      const localizedResults = results.map((group) =>
        group.map((item) => ({
          ...item,
          name:
            activeLang === "es"
              ? item.name_es || item.name_en
              : item.name_en || item.name_es,
          notes:
            activeLang === "es"
              ? item.notes_es || item.notes_en
              : item.notes_en || item.notes_es,
        }))
      );

      setRealWorldItems(localizedResults);
      setSelectedItems(localizedResults.map((group) => group?.[0] || null));
    } catch (err) {
      console.error("Failed to fetch real world items:", err);
    }
  };

  if (selectedUnits.every(Boolean)) {
    fetchRealWorldItems();
  }
}, [selectedUnits, activeLang]);


  const handleInputChange = (index, val) => {
    const updated = [...inputValues];
    updated[index] = val;
    setInputValues(updated);
  };

  return (
    <div className="w-full grid gap-4">
      <h2 className="text-center text-xl font-bold text-gray-700 mb-2">
        {t("terms.volume_comparison")}
      </h2>

      <div className="flex flex-col lg:flex-row gap-6">
        {[0, 1, 2].map((boxIndex) => {
          const unit = units.find((u) => u.id === selectedUnits[boxIndex]);
          const itemsForThisBox = realWorldItems[boxIndex] || [];
          const selectedItem = selectedItems[boxIndex];
          const approxValue = selectedItem?.approx_value || null;
          const input = parseFloat(inputValues[boxIndex] || "0");

          const hasValidInput = approxValue && !isNaN(input) && input > 0;
          const result = hasValidInput ? input * approxValue : null;

          return (
            <div
              key={boxIndex}
              className="w-full p-4 rounded shadow flex flex-col gap-3 mb-3 [&>*:last-child]:mb-0"
              style={{ backgroundColor: theme?.box }}
            >
              {/* Input */}
              <div className="relative w-full">
                <input
                  type="text"
                  value={inputValues[boxIndex]}
                  onChange={(e) => {
                    const raw = e.target.value.match(/^\d*\.?\d*/)?.[0] || "";
                    handleInputChange(boxIndex, raw);
                  }}
                  placeholder={t("terms.enter_value")}
                  className="border p-2 rounded w-full text-left font-mono"
                />
              </div>

              {/* Unit Name */}
              <div className="p-2 border rounded bg-white text-sm">
                {unit?.name}
              </div>

              {/* Toggle */}
              <div className="flex justify-center gap-2 mb-2">
                <button
                  className={`px-3 py-1 rounded-l ${
                    !comparisonToggles[boxIndex]
                      ? "text-white"
                      : "bg-white border text-black"
                  }`}
                  style={{
                    borderColor: "#ccc",
                    backgroundColor: !comparisonToggles[boxIndex]
                      ? primaryColor
                      : "white",
                  }}
                  onClick={() =>
                    setComparisonToggles((prev) =>
                      prev.map((val, i) => (i === boxIndex ? false : val)),
                    )
                  }
                >
                  {t("terms.general")}
                </button>
                <button
                  className={`px-3 py-1 rounded-r ${
                    comparisonToggles[boxIndex]
                      ? "text-white"
                      : "bg-white border text-black"
                  }`}
                  style={{
                    borderColor: "#ccc",
                    backgroundColor: comparisonToggles[boxIndex]
                      ? primaryColor
                      : "white",
                  }}
                  onClick={() =>
                    setComparisonToggles((prev) =>
                      prev.map((val, i) => (i === boxIndex ? true : val)),
                    )
                  }
                >
                  {t("terms.scientific")}
                </button>
              </div>

              {/* Result Display */}
              <div className="overflow-x-auto max-w-full">
                <div className="bg-gray-100 p-3 rounded text-center text-blue-700 font-bold text-sm sm:text-base min-h-[48px] flex items-center justify-center">
                  <div className="break-super break-words whitespace-normal text-wrap text-balance leading-snug">
                    {result !== null ? (
                      <>
                        {formatNumber(
                          result,
                          comparisonToggles[boxIndex],
                          true,
                        )}{" "}
                        {unit?.symbol || ""}
                      </>
                    ) : (
                      unit?.symbol || ""
                    )}
                  </div>
                </div>
              </div>

              {/* Real-world items cards */}
              <div className="h-[300px] overflow-y-auto pr-1 sm:max-h-[none] max-h-[60vh] flex flex-col gap-2 [&>*:last-child]:mb-0">
                {itemsForThisBox.map((item) => (
                  <div
                    key={item.id}
                    onClick={() =>
                      setSelectedItems((prev) =>
                        prev.map((it, i) => (i === boxIndex ? item : it)),
                      )
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setSelectedItems((prev) =>
                          prev.map((it, i) => (i === boxIndex ? item : it)),
                        );
                      }
                    }}
                    className={`cursor-pointer border rounded p-3 shadow-sm w-full max-w-full overflow-visible ${
                      selectedItems[boxIndex]?.id === item.id
                        ? "bg-blue-50 border-blue-400"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-semibold text-blue-800 text-center text-sm md:text-base">
                      {item.name}
                    </div>
                    {item.notes && (
                      <div
                        className="prose prose-sm max-w-none text-left text-gray-600 mt-2"
                        dangerouslySetInnerHTML={{ __html: item.notes }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <FooterNote categoryId={categoryId} />
    </div>
  );
}

export default MoleConverter;