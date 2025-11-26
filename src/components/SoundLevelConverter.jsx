import React, { useEffect, useState } from "react";
import pb from "../utils/pocketbaseClient";
import RealWorldBox from "./RealWorldBox";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";

function SoundLevelConverter({ categoryId, lang }) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const activeLang = lang || i18n.language || "en";

  const [rawUnits, setRawUnits] = useState([]);
  const [rawItems, setRawItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [realWorldItems, setRealWorldItems] = useState([]);
  const [fromUnit, setFromUnit] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [selectedItems, setSelectedItems] = useState([null, null]);
  const [filteredItems, setFilteredItems] = useState([[], []]);

  /** ---------------------
   * Helper: parse numeric value safely
   * --------------------- */
  const numValue = (item) => {
    if (!item) return NaN;
    const raw = item.approx_value ?? item.scientific_value ?? "";
    const cleaned = String(raw).trim().replace(",", ".");
    const n = parseFloat(cleaned);
    return isNaN(n) ? NaN : n;
  };

  /** ---------------------
   * Fetch units
   * --------------------- */
  useEffect(() => {
    if (!categoryId) return;
    const loadUnits = async () => {
      try {
        const unitList = await pb.collection("units").getFullList({
          filter: `category = "${categoryId}"`,
        });
        setRawUnits(unitList || []);
        setFromUnit(unitList?.[0]?.id || "");
      } catch (err) {
        console.error("loadUnits error", err);
      }
    };
    loadUnits();
  }, [categoryId]);

  /** ---------------------
   * Fetch real-world items
   * --------------------- */
  useEffect(() => {
    if (!categoryId) return;
    const loadItems = async () => {
      try {
        const response = await pb.collection("realworld_items").getFullList({
          filter: `category = "${categoryId}"`,
          expand: "unit",
        });

        const validItems = (response || []).filter((item) => {
          const v = item.approx_value ?? item.scientific_value;
          if (v == null) return false;
          const cleaned = String(v).trim().replace(",", ".");
          return cleaned !== "" && !isNaN(parseFloat(cleaned));
        });

        setRawItems(validItems);
      } catch (err) {
        console.error("loadRealWorldItems error", err);
      }
    };
    loadItems();
  }, [categoryId]);

  /** ---------------------
   * Localize units & items whenever language changes
   * --------------------- */
  useEffect(() => {
    /** Localize units */
    const localizedUnits = rawUnits.map((u) => {
      const symbol = u.symbol?.toString() || "";

      const displayName =
        activeLang === "es"
          ? u.name_es?.trim()
            ? `${u.name_es} (${symbol})`
            : symbol
          : u.name_en?.trim()
          ? `${u.name_en} (${symbol})`
          : u.name_es?.trim()
          ? `${u.name_es} (${symbol})`
          : symbol;

      return { ...u, name: displayName };
    });
    setUnits(localizedUnits);

    /** Localize items */
    const localizedItems = rawItems.map((it) => {
      const name =
        activeLang === "es"
          ? it.name_es || it.name_en || it.name || ""
          : it.name_en || it.name_es || it.name || "";
      const notes =
        activeLang === "es"
          ? it.notes_es || it.notes_en || it.notes || ""
          : it.notes_en || it.notes_es || it.notes || "";
      const expression =
        activeLang === "es"
          ? it.expression_es || it.expression_en || it.expression || ""
          : it.expression_en || it.expression_es || it.expression || "";

      return { ...it, name, notes, expression };
    });

    setRealWorldItems(localizedItems);
  }, [activeLang, rawUnits, rawItems]);

  /** ---------------------
   * Filter nearest lower / higher items based on input
   * --------------------- */
  useEffect(() => {
    if (!inputValue || inputValue === "-") {
      setFilteredItems([realWorldItems, realWorldItems]);
      setSelectedItems([realWorldItems[0] || null, realWorldItems[0] || null]);
      return;
    }

    const parsedInput = parseFloat(inputValue.replace(",", "."));
    if (isNaN(parsedInput)) {
      setFilteredItems([[], []]);
      setSelectedItems([null, null]);
      return;
    }

    const sorted = [...realWorldItems].sort((a, b) => numValue(a) - numValue(b));
    const values = sorted.map(numValue);

    let nearestLower = null;
    for (let i = values.length - 1; i >= 0; i--) {
      if (!isNaN(values[i]) && values[i] <= parsedInput) {
        nearestLower = values[i];
        break;
      }
    }

    let nearestHigher = null;
    for (let i = 0; i < values.length; i++) {
      if (!isNaN(values[i]) && values[i] > parsedInput) {
        nearestHigher = values[i];
        break;
      }
    }

    const lowerGroup = nearestLower !== null ? sorted.filter(it => numValue(it) === nearestLower) : [];
    const higherGroup = nearestHigher !== null ? sorted.filter(it => numValue(it) === nearestHigher) : [];

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
              const raw = e.target.value.match(/^-?$|^-?\d{0,3}(\.\d*)?$/)?.[0] || "";
              if (
                raw === "" ||
                raw === "-" ||
                (!isNaN(raw) && parseFloat(raw) >= -30 && parseFloat(raw) <= 310)
              ) {
                setInputValue(raw);
              }
            }}
            placeholder={t("terms.enter_value_range_30_310")}
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
                        {numValue(selectedItem)}{" "}
                        {selectedItem.expand?.unit?.symbol || ""}
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
                  <div
                    key={index}
                    className="w-full p-4 rounded shadow"
                    style={{ backgroundColor: theme?.box }}
                  />
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
