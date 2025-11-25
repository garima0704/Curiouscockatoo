import React, { useEffect, useMemo, useState } from "react";
import pb from "../utils/pocketbaseClient";
import RealWorldBox from "./RealWorldBox";
import { useTheme } from "../context/ThemeContext";
import FooterNote from "./FooterNote";
import { useTranslation } from "react-i18next";

function SoundLevelConverter({ categoryId, lang = "en" }) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const primaryColor = theme?.primary || "#2b66e6";

  // raw data (never localized) — used for numeric logic
  const [rawUnits, setRawUnits] = useState([]);
  const [rawItems, setRawItems] = useState([]);

  // localized views derived from raw data
  const [units, setUnits] = useState([]);
  const [realWorldItems, setRealWorldItems] = useState([]);

  const [fromUnit, setFromUnit] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [selectedItems, setSelectedItems] = useState([null, null]); // selected representative items for two boxes
  const [filteredItems, setFilteredItems] = useState([[], []]); // arrays of items inside each box

  // keep i18n in sync
  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang, i18n]);

  if (!i18n.isInitialized) return null;

  const placeholderText = useMemo(() => t("terms.enter_value_range_30_310"), [t, lang]);

  /** ---------------------
   *  FETCH RAW UNITS (only when categoryId changes)
   *  we DON'T localize names here so numeric data stays stable
   *  --------------------- */
  useEffect(() => {
    if (!categoryId) return;

    const loadUnits = async () => {
      try {
        const unitList = await pb.collection("units").getFullList({
          filter: `category = "${categoryId}"`,
        });

        // keep raw
        setRawUnits(unitList || []);

        // choose default fromUnit (base or first)
        const defaultFrom = (unitList[0] && unitList[0].id) || "";
        setFromUnit(defaultFrom);
      } catch (err) {
        console.error("loadUnits error", err);
      }
    };

    loadUnits();
  }, [categoryId]);

  /** ---------------------
   *  FETCH RAW REAL-WORLD ITEMS (only when categoryId changes)
   *  We store raw numeric fields intact (approx_value, scientific_value, expression)
   *  --------------------- */
  useEffect(() => {
    if (!categoryId) return;

    const loadItems = async () => {
      try {
        const response = await pb.collection("realworld_items").getFullList({
          filter: `category = "${categoryId}"`,
          expand: "unit",
        });

        // keep only items that have numeric values (do not localize)
        const valid = (item) => {
          const v = item.approx_value ?? item.scientific_value;
          // allow "0" as valid; trim strings and replace comma with dot (in case)
          if (v == null) return false;
          const cleaned = String(v).trim().replace(",", ".");
          return cleaned !== "" && !isNaN(parseFloat(cleaned));
        };

        const raw = (response || []).filter(valid);
        setRawItems(raw);
        // init filtered/selected with raw items (localized view will update names separately)
        setFilteredItems([raw, raw]);
        setSelectedItems([raw[0] || null, raw[0] || null]);
      } catch (err) {
        console.error("loadRealWorldItems error", err);
      }
    };

    loadItems();
  }, [categoryId]);

  /** ---------------------
   *  LOCALIZE VIEWS WHEN lang CHANGES
   *  Keep numeric fields the same; only change name/notes/expressions used for display
   *  --------------------- */
  useEffect(() => {
    // Localize units (display label). We will build a display name that avoids duplicate symbols.
    const localizedUnits = rawUnits.map((u) => {
      const nameEn = u.name_en?.trim() || "";
      const symbol = u.symbol?.toString?.() || "";

      // make base name without symbol if english already contains it
      let baseName = nameEn;
      if (baseName.includes(`(${symbol})`)) {
        baseName = baseName.replace(`(${symbol})`, "").trim();
      }

      const display = lang === "es" ? `(${symbol})` : `${baseName} (${symbol})`;

      return {
        ...u,
        name: display,
      };
    });
    setUnits(localizedUnits);

    // Localize items (only textual fields)
    const localizedItems = rawItems.map((it) => {
      const name = lang === "es" ? it.name_es || it.name_en || it.name : it.name_en || it.name_es || it.name;
      const notes = lang === "es" ? it.notes_es || it.notes_en || it.notes : it.notes_en || it.notes_es || it.notes;
      const expression = lang === "es" ? it.expression_es || it.expression_en || it.expression : it.expression_en || it.expression_es || it.expression;

      return {
        ...it,
        name,
        notes,
        expression,
      };
    });

    setRealWorldItems(localizedItems);

    // Keep filteredItems and selectedItems consistent with new localized list:
    setFilteredItems([localizedItems, localizedItems]);
    setSelectedItems([localizedItems[0] || null, localizedItems[0] || null]);
  }, [lang, rawUnits, rawItems]);

  /** ---------------------
   *  HELPERS
   *  parse numeric safely handling commas & strings
   *  --------------------- */
  const numValue = (item) => {
    if (!item) return NaN;
    const raw = item.approx_value ?? item.scientific_value ?? "";
    const cleaned = String(raw).trim().replace(",", ".");
    const n = parseFloat(cleaned);
    return isNaN(n) ? NaN : n;
  };

  /** ---------------------
   *  MAIN: compute nearest lower / higher groups when input changes
   *  - stable numeric sort
   *  - deterministic tiebreaker on id
   *  - group all items that share the same numeric value into same box
   *  --------------------- */
  useEffect(() => {
    // reset for empty or dash
    if (inputValue === "" || inputValue === "-") {
      setFilteredItems([realWorldItems, realWorldItems]);
      setSelectedItems([realWorldItems[0] || null, realWorldItems[0] || null]);
      return;
    }

    const parsedInput = parseFloat(String(inputValue).trim().replace(",", "."));
    if (isNaN(parsedInput) || parsedInput < -30 || parsedInput > 310) {
      setFilteredItems([[], []]);
      setSelectedItems([null, null]);
      return;
    }

    // stable numeric sort with id tie-breaker
    const sorted = [...realWorldItems].slice().sort((a, b) => {
      const va = numValue(a);
      const vb = numValue(b);
      if (va !== vb) return va - vb;
      // tie-breaker
      return String(a.id || "").localeCompare(String(b.id || ""));
    });

    // build arrays of numbers
    const values = sorted.map((it) => numValue(it));

    // find nearest lower value (<= input)
    let nearestLowerValue = null;
    for (let i = values.length - 1; i >= 0; i--) {
      if (!isNaN(values[i]) && values[i] <= parsedInput) {
        nearestLowerValue = values[i];
        break;
      }
    }

    // find nearest higher value (> input)
    let nearestHigherValue = null;
    for (let i = 0; i < values.length; i++) {
      if (!isNaN(values[i]) && values[i] > parsedInput) {
        nearestHigherValue = values[i];
        break;
      }
    }

    const lowerGroup = nearestLowerValue !== null
      ? sorted.filter((it) => numValue(it) === nearestLowerValue)
      : [];

    const higherGroup = nearestHigherValue !== null
      ? sorted.filter((it) => numValue(it) === nearestHigherValue)
      : [];

    setFilteredItems([lowerGroup, higherGroup]);
    setSelectedItems([lowerGroup[0] || null, higherGroup[0] || null]);
  }, [inputValue, realWorldItems]);

  return (
    <div className="space-y-10 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Input Section */}
        <div className="w-full lg:w-64 flex flex-col items-center justify-center gap-4">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              // allow negative sign and up to 3 digits with optional decimal
              const raw = e.target.value.match(/^-?$|^-?\d{0,3}(\.\d*)?$/)?.[0] || "";
              if (
                raw === "" ||
                raw === "-" ||
                (!isNaN(raw) &&
                  parseFloat(raw) >= -30 &&
                  parseFloat(raw) <= 310)
              ) {
                setInputValue(raw);
              }
            }}
            placeholder={placeholderText}
            className="border p-2 rounded w-full text-left font-mono"
          />

          <div className="border rounded max-h-40 overflow-y-auto w-full text-sm space-y-1 bg-white">
            {units.map((u) => (
              <div
                key={u.id}
                className={`cursor-pointer p-1 rounded hover:bg-blue-100 ${
                  fromUnit === u.id ? "bg-blue-200 font-medium" : ""
                }`}
                onClick={() => setFromUnit(u.id)}
              >
                {u.name}
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Boxes */}
        <div className="flex-1 space-y-10">
          <div>
            <div className="text-center text-xl font-bold text-gray-700 mb-2">
              {t("terms.comparison")}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Always render exactly two boxes (lower & higher) — each box receives all items that share that numeric value */}
              {selectedItems.map((selectedItem, index) =>
                selectedItem ? (
                  <div
                    key={index}
                    className="w-full p-4 rounded shadow flex flex-col gap-3"
                    style={{ backgroundColor: theme?.box }}
                  >
                    <div className="text-center font-semibold text-gray-800">
                      {t("terms.reference")}
                    </div>

                    <div className="overflow-x-auto max-w-full">
                      <div className="bg-gray-100 p-3 rounded text-center text-blue-700 font-bold text-sm sm:text-base min-h-[48px] flex items-center justify-center">
                        {selectedItem && (
                          <>
                            {numValue(selectedItem)}{" "}
                            {selectedItem.expand?.unit?.symbol || ""}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="h-[300px] overflow-y-auto pr-1 max-h-[80vh]">
                      <RealWorldBox
                        selected={selectedItem}
                        setSelected={(val) =>
                          setSelectedItems((prev) => prev.map((it, i) => (i === index ? val : it)))
                        }
                        items={filteredItems[index]}
                        scientificToggle={false}
                      />
                    </div>
                  </div>
                ) : (
                  // render a blank placeholder if there is no item for this slot
                  <div key={index} className="w-full p-4 rounded shadow" style={{ backgroundColor: theme?.box }} />
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SoundLevelConverter;
