import React, { useEffect, useState } from "react";
import pb from "../utils/pocketbaseClient";
import AngleRealWorldBox from "./AngleRealWorldBox";
import { formatNumber } from "../utils/formatNumber";
import { useTheme } from "../context/ThemeContext";
import { angleUnits } from "../data/angleUnits";
import FooterNote from "./FooterNote";
import { useTranslation } from "react-i18next";

function AngleConverter({ categoryId, lang = "en" }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const primaryColor = theme?.primary || "#2b66e6";
  const activeLang = lang || "en";

  const [units, setUnits] = useState([]);
  const [fromConversionUnit, setFromConversionUnit] = useState("");
  const [conversionInput, setConversionInput] = useState("");
  const [selectedConversionUnits, setSelectedConversionUnits] = useState([]);
  const [conversionToggles, setConversionToggles] = useState([false, false, false]);
  const [isFocused, setIsFocused] = useState(false);

  const [fromComparisonUnit, setFromComparisonUnit] = useState("");
  const [comparisonValue, setComparisonValue] = useState("1");
  const [comparisonToggles, setComparisonToggles] = useState([false, false, false]);

  const [realWorldItems, setRealWorldItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([null, null, null]);
  const [categoryInfo, setCategoryInfo] = useState(null);

  // Localized unit name
  const localizedUnitName = (u) =>
    activeLang === "es" ? u?.name_es || u?.name_en || u?.symbol || "" : u?.name_en || u?.name_es || u?.symbol || "";

  // ---------------- FETCH CATEGORY ----------------
  useEffect(() => {
    if (!categoryId) return;
    const fetchCategory = async () => {
      try {
        const category = await pb.collection("categories").getOne(categoryId);
        setCategoryInfo(category || null);
      } catch (e) {
        console.error("Failed to fetch category:", e);
      }
    };
    fetchCategory();
  }, [categoryId]);

  // ---------------- FETCH UNITS ----------------
 useEffect(() => {
  if (!categoryId) return;

  const fetchUnits = async () => {
    try {
      const unitList = await pb.collection("units").getFullList({
        filter: `category = "${categoryId}"`,
      });

      // Map units with localizedName based on activeLang
      const localized = unitList.map((u) => ({
        ...u,
        localizedName: activeLang === "es" ? u.name_es : u.name_en,
      }));

      // Sort by base factor
      const sorted = localized.sort(
        (a, b) => parseFloat(a.to_base_factor ?? 0) - parseFloat(b.to_base_factor ?? 0)
      );

      // ---- ADD CONSOLE LOGS HERE ----
      console.log("Comparison Value:", comparisonValue);
      console.log(
        "Degree Units:",
        sorted.filter((u) => {
          const sym = (u.symbol || "").toLowerCase();
          return sym === "deg" || sym === "°";
        })
      );
      // ------------------------------

      setUnits(sorted);

      // Default "from" unit
      setFromConversionUnit((prev) => {
        if (prev && sorted.find((s) => s.id === prev)) return prev;
        const categoryBase = categoryInfo?.base_unit;
        if (categoryBase && sorted.find((s) => s.id === categoryBase)) return categoryBase;
        return sorted[0]?.id || "";
      });

      // Conversion targets (first 3 units not equal to "from")
      setSelectedConversionUnits((prev) => {
        if (prev?.length && prev.every((id) => sorted.some((s) => s.id === id))) return prev;
        const fromId = sorted[0]?.id;
        return sorted.filter((u) => u.id !== fromId).slice(0, 3).map((u) => u.id);
      });

      // Default comparison unit = degree (based on symbol only)
      const degree = sorted.find((u) => {
        const sym = (u.symbol || "").toLowerCase();
        return sym === "deg" || sym === "°";
      });

      console.log("Degree unit found:", degree);

      setFromComparisonUnit((prev) => {
        if (prev && sorted.find((s) => s.id === prev)) return prev;
        if (degree) return degree.id;
        return sorted[0]?.id || "";
      });
    } catch (e) {
      console.error("Failed to fetch units:", e);
    }
  };

  fetchUnits();
},[categoryId, activeLang, categoryInfo]);

useEffect(() => {
  if (!units.length || realWorldItems.length === 0) return;

  const DEGREE_ID = "1lng9qe37ceyly2";
  if (units.some(u => u.id === DEGREE_ID)) {
    setFromComparisonUnit((prev) => prev || DEGREE_ID);
  }
}, [units, realWorldItems]);




  // ---------------- FETCH REAL WORLD ITEMS ----------------
  useEffect(() => {
    if (!categoryId || !fromComparisonUnit || units.length === 0) return;

    const fetchItems = async () => {
      try {
        const items = await pb.collection("realworld_items").getFullList({
          filter: `category = "${categoryId}"`,
        });

        const localized = items.map((item) => ({
          ...item,
          angle_degree: (item.angle_degree ?? "").toString(),
          distance_unit: (item.distance_unit ?? "").toLowerCase(),
          localizedName:
            activeLang === "es"
              ? item.name_es || item.name_en || item.name || ""
              : item.name_en || item.name_es || item.name || "",
          localizedNotes:
            activeLang === "es"
              ? item.notes_es || item.notes_en || item.notes || ""
              : item.notes_en || item.notes_es || item.notes || "",
          localizedExpression:
            activeLang === "es"
              ? item.expression_es || item.expression_en || item.expression || ""
              : item.expression_en || item.expression_es || item.expression || "",
        }));

        const getVal = (item) => {
          if (!item?.distance_unit) return Infinity;
          const fromUnit = angleUnits.find(
            (u) => (u.symbol || "").toLowerCase() === item.distance_unit
          );
          const val = parseFloat(item.distance_value);
          if (!fromUnit || isNaN(val)) return Infinity;
          return val * (parseFloat(fromUnit.to_base_factor) || 1);
        };

        const sortedItems = [...localized].sort((a, b) => getVal(a) - getVal(b));
        setRealWorldItems(sortedItems);

        setSelectedItems((prev) => {
          return [0, 1, 2].map((i) => {
            const prevItem = prev?.[i];
            if (prevItem) {
              const found = sortedItems.find(
                (it) =>
                  Number(it.distance_value) === Number(prevItem.distance_value) &&
                  it.distance_unit === prevItem.distance_unit
              );
              if (found) return { ...found };
            }
            return sortedItems[i] ? { ...sortedItems[i] } : null;
          });
        });
		
		 // --- ADD CONSOLE LOGS HERE ---
      console.log("realWorldItems", sortedItems);
      console.log("selectedItems", [0, 1, 2].map((i) => sortedItems[i] || null));
      // ------------------------------
	  
      } catch (e) {
        console.error("Failed to fetch real-world items:", e);
        setRealWorldItems([]);
      }
    };

    fetchItems();
  }, [categoryId, fromComparisonUnit, units]);

  // Update localized fields on language change
  useEffect(() => {
    if (!realWorldItems.length) return;
    setSelectedItems((prevSelected) =>
      prevSelected.map((item) => {
        if (!item) return null;
        const match = realWorldItems.find(
          (rw) =>
            Number(rw.distance_value) === Number(item.distance_value) &&
            rw.distance_unit === item.distance_unit
        );
        return match
          ? {
              ...item,
              localizedName: match.localizedName,
              localizedNotes: match.localizedNotes,
              localizedExpression: match.localizedExpression,
            }
          : item;
      })
    );
  }, [activeLang, realWorldItems]);

  // ---------------- HELPERS ----------------
  const getUnitById = (id) => units.find((u) => u.id === id);
  const safeParseFactor = (f) => (f == null ? NaN : parseFloat(f));

  const getConvertedValue = (toUnitId) => {
    const from = getUnitById(fromConversionUnit);
    const to = getUnitById(toUnitId);
    if (!from || !to || conversionInput === "") return null;
    const inputNum = parseFloat(conversionInput);
    if (isNaN(inputNum)) return null;
    const base = inputNum * (safeParseFactor(from.to_base_factor) || 0);
    const toFactor = safeParseFactor(to.to_base_factor) || 0;
    return toFactor ? base / toFactor : null;
  };

  // ---------------- UI ----------------
  return (
    <div className="space-y-10">
      {/* Top notes */}
      {categoryInfo?.top_notes && (
        <div
          className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded text-sm text-gray-800 mb-6"
          dangerouslySetInnerHTML={{ __html: categoryInfo.top_notes }}
        />
      )}

      {/* Conversion section */}
      {units.length > 1 && (
        <div className="flex flex-col items-center gap-6">
          <div className="text-xl font-bold text-gray-700">{t("terms.conversion")}</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
            {/* Input box */}
            <div className="flex flex-col gap-3 bg-white p-4 rounded shadow">
              <input
                type="text"
                value={
                  isFocused
                    ? conversionInput
                    : conversionInput
                    ? `${conversionInput} ${getUnitById(fromConversionUnit)?.symbol || ""}`
                    : ""
                }
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChange={(e) => {
                  const raw = e.target.value.match(/^\d*\.?\d*/)?.[0] || "";
                  setConversionInput(raw);
                }}
                placeholder={t("terms.enter_value")}
                className="border p-2 rounded font-mono"
              />
              <div className="border rounded max-h-40 overflow-y-auto text-sm">
                {units.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => setFromConversionUnit(u.id)}
                    className={`cursor-pointer p-1 rounded hover:bg-blue-100 ${
                      fromConversionUnit === u.id ? "bg-blue-200 font-medium" : ""
                    }`}
                  >
                    {u.localizedName} ({u.symbol})
                  </div>
                ))}
              </div>
            </div>

            {/* Output boxes */}
            {selectedConversionUnits.map((toUnitId, index) => {
              const current = getUnitById(toUnitId);
              return (
                <div
                  key={index}
                  className="p-4 rounded shadow flex flex-col gap-3"
                  style={{ backgroundColor: theme?.box }}
                >
                  <div className="flex justify-center gap-2">
                    <button
                      className={`px-3 py-1 rounded-l ${
                        !conversionToggles[index] ? "text-white" : "bg-white border text-black"
                      }`}
                      style={{ backgroundColor: !conversionToggles[index] ? primaryColor : "white" }}
                      onClick={() =>
                        setConversionToggles((prev) => prev.map((t, i) => (i === index ? false : t)))
                      }
                    >
                      {t("terms.general")}
                    </button>
                    <button
                      className={`px-3 py-1 rounded-r ${
                        conversionToggles[index] ? "text-white" : "bg-white border text-black"
                      }`}
                      style={{ backgroundColor: conversionToggles[index] ? primaryColor : "white" }}
                      onClick={() =>
                        setConversionToggles((prev) => prev.map((t, i) => (i === index ? true : t)))
                      }
                    >
                      {t("terms.scientific")}
                    </button>
                  </div>

                  <div className="bg-gray-100 p-3 rounded text-center text-blue-700 font-bold min-h-[48px] flex items-center justify-center">
                    {getConvertedValue(toUnitId) != null
                      ? `${formatNumber(getConvertedValue(toUnitId), conversionToggles[index])} ${
                          current?.symbol || ""
                        }`
                      : current?.symbol || ""}
                  </div>

                  <div className="border rounded max-h-36 overflow-y-auto text-sm bg-white">
                    {units
                      .filter((u) => u.id !== fromConversionUnit)
                      .map((u) => (
                        <div
                          key={u.id}
                          onClick={() =>
                            setSelectedConversionUnits((prev) => prev.map((id, i) => (i === index ? u.id : id)))
                          }
                          className={`cursor-pointer p-1 hover:bg-blue-100 ${
                            toUnitId === u.id ? "bg-blue-200 font-medium" : ""
                          }`}
                        >
                          {u.localizedName} ({u.symbol})
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comparison section */}
{/* Comparison section */}
<div className="text-center text-xl font-bold text-gray-700">
  {t("terms.comparison")}
</div>

<div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
  {/* Left selector */}
  <div className="flex flex-col gap-3 bg-white p-4 rounded shadow">
    <select
      value={comparisonValue}
      onChange={(e) => setComparisonValue(e.target.value)}
      className="border px-2 py-2 rounded text-sm"
    >
      <option value="1">1</option>
      <option value="5">5</option>
      <option value="10">10</option>
    </select>

    <div className="border rounded max-h-40 overflow-y-auto text-sm">
      {units
        .filter((u) => {
          const sym = (u.symbol || "").toLowerCase();
          return sym === "deg" || sym === "°";
        })
        .map((u) => (
          <div
            key={u.id}
            onClick={() => setFromComparisonUnit(u.id)}
            className={`cursor-pointer p-1 hover:bg-blue-100 ${
              fromComparisonUnit === u.id ? "bg-blue-200 font-medium" : ""
            }`}
          >
            {activeLang === "es" ? u.name_es : u.name_en} ({u.symbol})
          </div>
        ))}
    </div>
  </div>

  {/* Comparison boxes */}
  {realWorldItems.length > 0 &&
    selectedItems.length === 3 &&
    [0, 1, 2].map((idx) => {
      const selectedItem = selectedItems[idx];
      if (!selectedItem) return null; // skip empty slots

      // --- SAFE MATCHING LOGIC ---
      const matchedItem = realWorldItems.find((item) => {
        const itemAngle = parseFloat(item.angle_degree ?? 0);
        const compareAngle = parseFloat(comparisonValue ?? 0);
        const itemDistance = parseFloat(item.distance_value ?? 0);
        const selectedDistance = parseFloat(selectedItem.distance_value ?? 0);
        const itemUnit = (item.distance_unit || "").trim().toLowerCase();
        const selectedUnit = (selectedItem.distance_unit || "").trim().toLowerCase();

        if (isNaN(itemAngle) || isNaN(compareAngle)) return false;
        if (isNaN(itemDistance) || isNaN(selectedDistance)) return false;

        const angleMatch = Math.abs(itemAngle - compareAngle) < 0.001;
        const distanceMatch = Math.abs(itemDistance - selectedDistance) < 0.001;
        const unitMatch = itemUnit === selectedUnit;

        return angleMatch && distanceMatch && unitMatch;
      });

      // Display localized name safely
      const displayName =
  activeLang === "es"
    ? (matchedItem?.name_es || selectedItem?.name_es || matchedItem?.localizedName)
    : (matchedItem?.name_en || selectedItem?.name_en || matchedItem?.localizedName);


      console.log("Matching:", matchedItem, "for selectedItem:", selectedItem);
      console.log("Rendering matchedItem:", matchedItem, "displayName:", displayName);

      return (
        <div
          key={idx}
          className="p-4 rounded shadow flex flex-col gap-3"
          style={{ backgroundColor: theme?.box }}
        >
          {/* Toggle */}
          <div className="flex justify-center gap-2">
            <button
              className={`px-3 py-1 rounded-l ${
                !comparisonToggles[idx] ? "text-white" : "bg-white border text-black"
              }`}
              style={{ backgroundColor: !comparisonToggles[idx] ? primaryColor : "white" }}
              onClick={() =>
                setComparisonToggles((prev) =>
                  prev.map((t, i) => (i === idx ? false : t))
                )
              }
            >
              {t("terms.general")}
            </button>
            <button
              className={`px-3 py-1 rounded-r ${
                comparisonToggles[idx] ? "text-white" : "bg-white border text-black"
              }`}
              style={{ backgroundColor: comparisonToggles[idx] ? primaryColor : "white" }}
              onClick={() =>
                setComparisonToggles((prev) =>
                  prev.map((t, i) => (i === idx ? true : t))
                )
              }
            >
              {t("terms.scientific")}
            </button>
          </div>

          {/* Arc length */}
          <div className="text-center font-semibold text-gray-700 text-sm">
            {t("terms.arc_length")}
          </div>
          <div className="bg-gray-100 p-3 rounded text-center text-blue-700 font-bold flex flex-col justify-center min-h-[48px]">
            <div>{matchedItem?.arc_length_value || "No Match"}</div>
            <div className="text-sm text-gray-600 mt-1">{displayName}</div>
          </div>

          {/* Distance selector */}
          <div className="flex items-center gap-2">
            <div className="flex justify-center w-8">
              <span className="text-sm font-semibold text-gray-700 transform -rotate-90">
                {t("terms.distance")}
              </span>
            </div>

            <AngleRealWorldBox
              selectedItem={selectedItem}
              realWorldItems={realWorldItems}
              index={idx}
              handleComparisonDropdownChange={(boxIndex, selected) => {
                const updated = [...selectedItems];
                updated[boxIndex] = { ...selected };
                setSelectedItems(updated);
              }}
            />
          </div>
        </div>
      );
    })}

  <div className="col-span-full mt-2">
    <FooterNote theme={theme} />
  </div>
</div>

</div>

  );
}

export default AngleConverter;
