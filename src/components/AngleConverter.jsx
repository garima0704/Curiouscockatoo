import React, { useEffect, useState } from "react";
import pb from "../utils/pocketbaseClient";
import AngleRealWorldBox from "./AngleRealWorldBox";
import { formatNumber } from "../utils/formatNumber";
import { useTheme } from "../context/ThemeContext";
import { angleUnits } from "../data/angleUnits";
import FooterNote from "./FooterNote";
import { useTranslation } from "react-i18next";

function AngleConverter({ categoryId, lang }) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const activeLang = lang || i18n.language || "en";
  const primaryColor = theme?.primary || "#2b66e6";

  const [categoryInfo, setCategoryInfo] = useState(null);
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

  // ---------------- FETCH CATEGORY + UNITS ----------------
  useEffect(() => {
    if (!categoryId) return;

    const load = async () => {
      try {
        const [unitList, category] = await Promise.all([
          pb.collection("units").getFullList({ filter: `category = "${categoryId}"` }),
          pb.collection("categories").getOne(categoryId),
        ]);

        const mappedCategory = {
          ...category,
          name:
            activeLang === "es"
              ? category.name_es || category.name_en || ""
              : category.name_en || category.name_es || "",
          top_notes:
            activeLang === "es"
              ? category.top_note_es || category.top_note_en || ""
              : category.top_note_en || category.top_note_es || "",
          slug:
            activeLang === "es"
              ? category.slug_es || category.slug_en || ""
              : category.slug_en || category.slug_es || "",
        };
        setCategoryInfo(mappedCategory);

        const localized = unitList.map((u) => ({
          ...u,
          localizedName:
            activeLang === "es"
              ? u.name_es || u.name_en || u.symbol || ""
              : u.name_en || u.name_es || u.symbol || "",
        }));

        const sorted = localized.sort(
          (a, b) => parseFloat(a.to_base_factor ?? 0) - parseFloat(b.to_base_factor ?? 0)
        );
        setUnits(sorted);

        // ------------------- DEFAULTS -------------------
        const defaultFrom = sorted[0]?.id || ""; // **first unit as default**
        setFromConversionUnit((prev) => (prev && sorted.find((s) => s.id === prev) ? prev : defaultFrom));

        const defaults = sorted.filter((u) => u.id !== defaultFrom).slice(0, 3).map((u) => u.id);
        setSelectedConversionUnits(defaults);

        const degree = sorted.find((u) => {
          const sym = (u.symbol || "").toLowerCase();
          return sym === "deg" || sym === "°" || sym === "degree";
        });
        setFromComparisonUnit(degree ? degree.id : sorted[0]?.id || "");
      } catch (e) {
        console.error("AngleConverter load error:", e);
      }
    };

    load();
  }, [categoryId, activeLang]);

  // ---------------- FETCH REAL WORLD ITEMS ----------------
  useEffect(() => {
    if (!categoryId) return;

    const loadItems = async () => {
      try {
        const list = await pb.collection("realworld_items").getFullList({
          filter: `category = "${categoryId}"`,
        });

        const localized = list.map((item) => ({
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

        const getVal = (it) => {
          if (!it?.distance_unit) return Infinity;
          const u = angleUnits.find((a) => (a.symbol || "").toLowerCase() === it.distance_unit);
          const v = parseFloat(it.distance_value);
          if (!u || isNaN(v)) return Infinity;
          return v * (parseFloat(u.to_base_factor) || 1);
        };

        const sorted = [...localized].sort((a, b) => getVal(a) - getVal(b));
        setRealWorldItems(sorted);

        const firstThree = sorted.filter((x) => x.type !== "blank").slice(0, 3);
        setSelectedItems([firstThree[0] || null, firstThree[1] || null, firstThree[2] || null]);
      } catch (e) {
        console.error("AngleConverter items error:", e);
        setRealWorldItems([]);
      }
    };

    loadItems();
  }, [categoryId, activeLang]);

  // update selected items on language change
  useEffect(() => {
    if (!realWorldItems.length) return;
    setSelectedItems((prev) =>
      prev.map((item) => {
        if (!item) return null;
        const match = realWorldItems.find(
          (rw) => Number(rw.distance_value) === Number(item.distance_value) && rw.distance_unit === item.distance_unit
        );
        return match
          ? { ...item, localizedName: match.localizedName, localizedNotes: match.localizedNotes, localizedExpression: match.localizedExpression }
          : item;
      })
    );
  }, [activeLang, realWorldItems]);

  const getUnitById = (id) => units.find((u) => u.id === id);
  const safeParse = (v) => (v == null ? NaN : parseFloat(v));

  const getConvertedValue = (toUnitId) => {
    const from = getUnitById(fromConversionUnit);
    const to = getUnitById(toUnitId);
    if (!from || !to || conversionInput === "") return null;
    const n = parseFloat(conversionInput);
    if (isNaN(n)) return null;
    const base = n * (safeParse(from.to_base_factor) || 0);
    const toF = safeParse(to.to_base_factor) || 0;
    return toF ? base / toF : null;
  };

  // ---------------- UI ----------------
  return (
    <div className="space-y-10">   
      {/* Conversion */}
      {units.length > 1 && (
        <div className="flex flex-col items-center gap-6">
          <div className="text-xl font-bold text-gray-700">{t("terms.conversion")}</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
            <div className="flex flex-col gap-3 bg-white p-4 rounded shadow">
              <input
                type="text"
                value={isFocused ? conversionInput : conversionInput ? `${conversionInput} ${getUnitById(fromConversionUnit)?.symbol || ""}` : ""}
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

            {selectedConversionUnits.map((toUnitId, idx) => {
              const current = getUnitById(toUnitId);
              return (
                <div key={idx} className="p-4 rounded shadow flex flex-col gap-3" style={{ backgroundColor: theme?.box }}>
                  <div className="flex justify-center gap-2">
                    <button
                      className={`px-3 py-1 rounded-l ${!conversionToggles[idx] ? "text-white" : "bg-white border text-black"}`}
                      style={{ backgroundColor: !conversionToggles[idx] ? primaryColor : "white" }}
                      onClick={() => setConversionToggles((prev) => prev.map((t, i) => (i === idx ? false : t)))}
                    >
                      {t("terms.general")}
                    </button>
                    <button
                      className={`px-3 py-1 rounded-r ${conversionToggles[idx] ? "text-white" : "bg-white border text-black"}`}
                      style={{ backgroundColor: conversionToggles[idx] ? primaryColor : "white" }}
                      onClick={() => setConversionToggles((prev) => prev.map((t, i) => (i === idx ? true : t)))}
                    >
                      {t("terms.scientific")}
                    </button>
                  </div>

                  <div className="bg-gray-100 p-3 rounded text-center text-blue-700 font-bold min-h-[48px] flex items-center justify-center">
                    {getConvertedValue(toUnitId) != null
                      ? `${formatNumber(getConvertedValue(toUnitId), conversionToggles[idx])} ${current?.symbol || ""}`
                      : current?.symbol || ""}
                  </div>

                  <div className="border rounded max-h-36 overflow-y-auto text-sm bg-white">
                    {units.filter((u) => u.id !== fromConversionUnit).map((u) => (
                      <div
                        key={u.id}
                        onClick={() => setSelectedConversionUnits((prev) => prev.map((id, i) => (i === idx ? u.id : id)))}
                        className={`cursor-pointer p-1 hover:bg-blue-100 ${toUnitId === u.id ? "bg-blue-200 font-medium" : ""}`}
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

      {/* Comparison */}
      <div className="text-center text-xl font-bold text-gray-700">{t("terms.comparison")}</div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
        <div className="flex flex-col gap-3 bg-white p-4 rounded shadow">
          <select value={comparisonValue} onChange={(e) => setComparisonValue(e.target.value)} className="border px-2 py-2 rounded text-sm">
            <option value="1">1</option>
            <option value="5">5</option>
            <option value="10">10</option>
          </select>

          <div className="border rounded max-h-40 overflow-y-auto text-sm">
            {units
              .filter((u) => ["deg", "°"].includes((u.symbol || "").toLowerCase()))
              .map((u) => (
                <div
                  key={u.id}
                  onClick={() => setFromComparisonUnit(u.id)}
                  className={`cursor-pointer p-1 hover:bg-blue-100 ${fromComparisonUnit === u.id ? "bg-blue-200 font-medium" : ""}`}
                >
                  {u.localizedName} ({u.symbol})
                </div>
              ))}
          </div>
        </div>

        {/* Real world boxes */}
        {realWorldItems.length > 0 &&
          selectedItems.length === 3 &&
          [0, 1, 2].map((idx) => {
            const selectedItem = selectedItems[idx];
            if (!selectedItem) return null;

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

            const displayName = matchedItem?.localizedName || selectedItem?.localizedName || "";

            return (
              <div key={idx} className="p-4 rounded shadow flex flex-col gap-3" style={{ backgroundColor: theme?.box }}>
                <div className="flex justify-center gap-2">
                  <button
                    className={`px-3 py-1 rounded-l ${!comparisonToggles[idx] ? "text-white" : "bg-white border text-black"}`}
                    style={{ backgroundColor: !comparisonToggles[idx] ? primaryColor : "white" }}
                    onClick={() => setComparisonToggles((prev) => prev.map((t, i) => (i === idx ? false : t)))}
                  >
                    {t("terms.general")}
                  </button>
                  <button
                    className={`px-3 py-1 rounded-r ${comparisonToggles[idx] ? "text-white" : "bg-white border text-black"}`}
                    style={{ backgroundColor: comparisonToggles[idx] ? primaryColor : "white" }}
                    onClick={() => setComparisonToggles((prev) => prev.map((t, i) => (i === idx ? true : t)))}
                  >
                    {t("terms.scientific")}
                  </button>
                </div>

                <div className="text-center font-semibold text-gray-700 text-sm">{t("terms.arc_length")}</div>
                <div className="bg-gray-100 p-3 rounded text-center text-blue-700 font-bold flex flex-col justify-center min-h-[48px]">
                  <div>{matchedItem?.arc_length_value || t("terms.no_match")}</div>
                  <div className="text-sm text-gray-600 mt-1">{displayName}</div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex justify-center w-8">
                    <span className="text-sm font-semibold text-gray-700 transform -rotate-90">{t("terms.distance")}</span>
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
