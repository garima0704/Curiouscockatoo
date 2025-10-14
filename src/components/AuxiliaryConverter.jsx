import React, { useState, useEffect } from "react";
import pb from "../utils/pocketbaseClient";
import RealWorldBox from "./RealWorldBox";
import { formatNumber } from "../utils/formatNumber";
import { useTheme } from "../context/ThemeContext";
import { parseScientific } from "../utils/parseScientific";
import { distributeBlankCards } from "../utils/blankCardDistributor";
import { useTranslation } from "react-i18next";

function AuxiliaryConverter({ categoryId, lang = "en" }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [units, setUnits] = useState([]);
  const [realWorldItems, setRealWorldItems] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [fromUnit, setFromUnit] = useState("");
  const [toUnit, setToUnit] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [conversionToggle, setConversionToggle] = useState(false);
  const [comparisonToggle, setComparisonToggle] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!categoryId) return;

      try {
        // 1️⃣ Fetch units with language-specific names
        const unitList = await pb.collection("units").getFullList({
          filter: `category = "${categoryId}"`,
        });

        const sortedUnits = unitList.sort((a, b) => a.to_base_factor - b.to_base_factor);

        // Map unit names based on language
        const localizedUnits = sortedUnits.map((u) => ({
          ...u,
          name: u[`name_${lang}`] || u.name, // e.g., name_es
        }));

        setUnits(localizedUnits);
        if (localizedUnits.length > 0) {
          setFromUnit(localizedUnits[0].id);
          setToUnit(localizedUnits[0].id);
        }

        // 2️⃣ Fetch real-world items with language-specific names
        const realItems = await pb.collection("realworld_items").getFullList({
          filter: `category = "${categoryId}"`,
          expand: "unit",
        });

        const localizedItems = realItems.map((item) => ({
          ...item,
          name: item[`name_${lang}`] || item.name,
        }));

        // Split forced-last items from normal
        const forcedItems = localizedItems.filter((i) => i.force_last_position === true);
        const normalItems = localizedItems.filter((i) => i.force_last_position !== true);

        const sortedNormal = normalItems.sort((a, b) => {
          const aVal =
            typeof a.approx_value === "string"
              ? parseScientific(a.approx_value)
              : a.approx_value ?? a.scientific_value ?? 0;
          const bVal =
            typeof b.approx_value === "string"
              ? parseScientific(b.approx_value)
              : b.approx_value ?? b.scientific_value ?? 0;
          return aVal - bVal;
        });

        const sortedReal = [...sortedNormal, ...forcedItems].map((item) => {
          const sciVal = parseScientific(item.scientific_value);
          return { ...item, exponent: sciVal ? Math.floor(Math.log10(sciVal)) : null };
        });

        const withBlanks = distributeBlankCards(sortedReal, 9);

        const final = [...withBlanks];
        const index = final.findIndex((i) => i.force_last_position === true);
        if (index !== -1) {
          const [forced] = final.splice(index, 1);
          final.push(forced);
        }

        setRealWorldItems(final);
        setSelectedItem(final.find((i) => i.type !== "blank") || null);
      } catch (error) {
        console.error("Error loading auxiliary data:", error);
      }
    }

    fetchData();
  }, [categoryId, lang]); // 🔑 Added lang dependency

  const getConvertedValue = (overrideToUnit = null) => {
    const from = units.find((u) => u.id === fromUnit);
    const to = units.find((u) => u.id === (overrideToUnit || toUnit));
    if (!from || !to || !inputValue) return null;
    const baseValue = parseFloat(inputValue) * from.to_base_factor;
    return baseValue / to.to_base_factor;
  };

  const getComparisonValue = () => {
    const from = units.find((u) => u.id === fromUnit);
    const inputNum = Number(inputValue);
    const approx = selectedItem?.approx_value;
    if (!from || isNaN(inputNum) || !approx) return null;
    const baseValue = inputNum * from.to_base_factor;
    return baseValue / approx;
  };

  return (
    <div className="flex flex-col gap-6 overflow-x-hidden" style={{ fontFamily: theme?.font }}>
      {/* Input Block */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <input
          type="text"
          value={
            inputValue && !isNaN(inputValue)
              ? isFocused
                ? inputValue
                : `${inputValue} ${units.find((u) => u.id === fromUnit)?.symbol || ""}`
              : ""
          }
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => {
            const raw = e.target.value.match(/^\d*\.?\d*/)?.[0] || "";
            if (raw === "" || (!isNaN(raw) && parseFloat(raw) >= 0)) {
              setInputValue(raw);
            }
          }}
          placeholder={t("terms.enter_value")}
          className="border p-2 rounded w-full max-w-[160px] text-gray-800"
          style={{ backgroundColor: theme?.base }}
        />

        <select
          value={fromUnit}
          onChange={(e) => setFromUnit(e.target.value)}
          className="border p-2 rounded w-full max-w-[200px] text-gray-800"
          style={{ backgroundColor: theme?.base }}
        >
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.symbol})
            </option>
          ))}
        </select>
      </div>

      {/* Conversion + Comparison Side-by-Side */}
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        {/* Conversion Box */}
        <div
          className="w-full sm:w-1/2 p-4 rounded shadow h-[420px] flex flex-col text-gray-800"
          style={{ backgroundColor: theme?.box }}
        >
          <div className="text-center text-lg font-semibold mb-2">
            {t("terms.conversion")}
          </div>

          {/* Toggle Buttons */}
          <div className="flex justify-center gap-2 mb-2">
            <button
              className={`px-4 py-1 rounded-l ${!conversionToggle ? "text-white" : "text-black border"}`}
              style={{
                backgroundColor: !conversionToggle ? theme?.primary : "#ffffff",
                borderColor: "#ccc",
              }}
              onClick={() => setConversionToggle(false)}
            >
              {t("terms.general")}
            </button>
            <button
              className={`px-4 py-1 rounded-r ${conversionToggle ? "text-white" : "text-black border"}`}
              style={{
                backgroundColor: conversionToggle ? theme?.primary : "#ffffff",
                borderColor: "#ccc",
              }}
              onClick={() => setConversionToggle(true)}
            >
              {t("terms.scientific")}
            </button>
          </div>

          {/* Result */}
          <div className="bg-gray-100 p-2 text-center font-bold text-sm sm:text-base rounded mb-2 min-h-[48px] text-blue-700 flex items-center justify-center whitespace-normal break-words break-all overflow-hidden max-w-full">
            {toUnit ? (
              inputValue && !isNaN(inputValue) ? (
                <>
                  {formatNumber(getConvertedValue(), conversionToggle)}{" "}
                  {units.find((u) => u.id === toUnit)?.symbol || ""}
                </>
              ) : (
                units.find((u) => u.id === toUnit)?.symbol || ""
              )
            ) : (
              ""
            )}
          </div>
          <div className="flex-1 overflow-y-auto border rounded p-2">
            {units.map((u) => (
              <div
                key={u.id}
                onClick={() => setToUnit(u.id)}
                className={`px-2 py-1 rounded mb-1 text-base cursor-pointer transition ${
                  u.id === toUnit
                    ? "bg-blue-100 font-semibold text-blue-700"
                    : "hover:bg-gray-100"
                }`}
              >
                {u.name} ({u.symbol})
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Box */}
        <div
          className="w-full sm:w-1/2 p-4 rounded shadow h-[420px] flex flex-col text-gray-800"
          style={{ backgroundColor: theme?.box }}
        >
          <div className="text-center text-lg font-semibold mb-2">
            {t("terms.comparison")}
          </div>
          <div className="flex justify-center gap-2 mb-2">
            <button
              className={`px-4 py-1 rounded-l ${!comparisonToggle ? "text-white" : "text-black border"}`}
              style={{
                backgroundColor: !comparisonToggle ? theme?.primary : "#ffffff",
                borderColor: "#ccc",
              }}
              onClick={() => setComparisonToggle(false)}
            >
              {t("terms.general")}
            </button>
            <button
              className={`px-4 py-1 rounded-r ${comparisonToggle ? "text-white" : "text-black border"}`}
              style={{
                backgroundColor: comparisonToggle ? theme?.primary : "#ffffff",
                borderColor: "#ccc",
              }}
              onClick={() => setComparisonToggle(true)}
            >
              {t("terms.scientific")}
            </button>
          </div>
		  
          {/* Comparison Result */}
          <div className="bg-gray-100 p-2 text-center font-bold text-sm sm:text-base rounded mb-2 min-h-[48px] text-blue-700 flex items-center justify-center whitespace-normal break-words break-all overflow-hidden max-w-full">
            {selectedItem && inputValue && !isNaN(getComparisonValue()) ? (
              <>{formatNumber(getComparisonValue(), comparisonToggle)} </>
            ) : (
              ""
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            <RealWorldBox
              selected={selectedItem}
              setSelected={setSelectedItem}
              items={realWorldItems}
              scientificToggle={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuxiliaryConverter;
