import React, { useEffect, useState } from "react";
import pb from "../utils/pocketbaseClient";
import AngleRealWorldBox from "./AngleRealWorldBox";
import { formatNumber } from "../utils/formatNumber";
import { useTheme } from "../context/ThemeContext";
import { parseScientific } from "../utils/parseScientific";
import { angleUnits } from "../data/angleUnits";
import FooterNote from "./FooterNote";

function AngleConverter({ categoryId }) {
  const theme = useTheme();
  const primaryColor = theme?.primary || "#2b66e6";

  const [units, setUnits] = useState([]);
  const [degreeUnit, setDegreeUnit] = useState(null);
  const [conversionInput, setConversionInput] = useState("");
  const [fromConversionUnit, setFromConversionUnit] = useState("");
  const [selectedConversionUnits, setSelectedConversionUnits] = useState([]);
  const [comparisonValue, setComparisonValue] = useState("1");
  const [fromComparisonUnit, setFromComparisonUnit] = useState("");
  const [conversionToggles, setConversionToggles] = useState([
    false,
    false,
    false,
  ]);
  const [isFocused, setIsFocused] = useState(false);
  const [realWorldItems, setRealWorldItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [comparisonToggles, setComparisonToggles] = useState([
    false,
    false,
    false,
  ]);
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [fromAngleValue, setFromAngleValue] = useState("");

  useEffect(() => {
    const fetchCategory = async () => {
      const category = await pb.collection("categories").getOne(categoryId);
      setCategoryInfo(category);
    };
    fetchCategory();
  }, [categoryId]);

  useEffect(() => {
    const fetchUnits = async () => {
      const unitList = await pb
        .collection("units")
        .getFullList({ filter: `category = "${categoryId}"` });

      const sorted = unitList.sort(
        (a, b) => a.to_base_factor - b.to_base_factor,
      );
      setUnits(sorted);

      const defaultFrom = sorted[0]?.id || "";
      setFromConversionUnit(defaultFrom);

      setSelectedConversionUnits(
        sorted
          .filter((u) => u.id !== defaultFrom)
          .slice(0, 3)
          .map((u) => u.id),
      );

      const degree = sorted.find((u) => u.name.toLowerCase() === "degree");
      if (degree) {
        setDegreeUnit(degree.id);
        setFromComparisonUnit(degree.id);
      }
    };

    fetchUnits();
  }, [categoryId]);

  useEffect(() => {
    const fetchRealWorldItems = async () => {
      if (!fromComparisonUnit) return;

      const items = await pb.collection("realworld_items").getFullList({
        filter: `category = "${categoryId}"`,
      });

      const safeItems = items.filter(
        (item) =>
          item.distance_unit &&
          angleUnits.some((u) => u.symbol === item.distance_unit),
      );

      const getVal = (item) => {
        const fromUnit = angleUnits.find(
          (u) => u.symbol === item.distance_unit,
        );
        const val = parseFloat(item.distance_value);

        if (!fromUnit || isNaN(val)) {
          console.warn(`SKIPPED: ${item.distance_value} ${item.distance_unit}`);
          return Infinity;
        }

        const converted = val * fromUnit.to_base_factor;
        console.log(`ITEM: ${val} ${fromUnit.symbol} → ${converted} m`);
        return converted;
      };

      const sortedItems = [...safeItems].sort((a, b) => getVal(a) - getVal(b));

      setRealWorldItems(sortedItems);

      setSelectedItems(
        sortedItems.slice(0, 3).map((item) => ({
          distance_value: item.distance_value,
          distance_unit: item.distance_unit,
        })),
      );
    };

    fetchRealWorldItems();
  }, [fromComparisonUnit, categoryId]);

  const getConvertedValue = (toUnitId) => {
    const from = units.find((u) => u.id === fromConversionUnit);
    const to = units.find((u) => u.id === toUnitId);
    if (!from || !to || !conversionInput) return null;
    const input = parseFloat(conversionInput);
    const base = input * from.to_base_factor;
    return base / to.to_base_factor;
  };

  const getUnitById = (id) => units.find((u) => u.id === id);

  const getComparisonValue = (toUnitId) => {
    const degree = units.find((u) => u.id === fromComparisonUnit);
    const to = units.find((u) => u.id === toUnitId);
    if (!degree || !to || !comparisonValue) return null;
    const input = parseFloat(comparisonValue);
    const base = input * degree.to_base_factor;
    return base / to.to_base_factor;
  };

  return (
    <div className="space-y-10">
      {categoryInfo?.top_notes && (
        <div
          className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded text-sm text-gray-800 mb-6"
          dangerouslySetInnerHTML={{ __html: categoryInfo.top_notes }}
        />
      )}
      {/* ✅ Conversion Section */}
      {units.length > 1 && (
        <div className="flex flex-col items-center gap-6">
          <div className="w-full text-center text-xl font-bold text-gray-700">
            Conversion
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
            {/* From Block */}
            <div className="flex flex-col items-start justify-start gap-3 bg-white p-4 rounded shadow">
              <input
                type="text"
                value={
                  isFocused || !fromConversionUnit
                    ? conversionInput
                    : conversionInput !== ""
                      ? `${conversionInput} ${units.find((u) => u.id === fromConversionUnit)?.symbol || ""}`
                      : ""
                }
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChange={(e) => {
                  const raw = e.target.value.match(/^\d*\.?\d*/)?.[0] || "";
                  if (raw === "" || (!isNaN(raw) && parseFloat(raw) >= 0)) {
                    setConversionInput(raw);
                  }
                }}
                placeholder="Enter value"
                className="border p-2 rounded w-full text-left font-mono"
              />

              <div className="border rounded max-h-40 overflow-y-auto w-full text-sm space-y-1 bg-white">
                {units.map((u) => (
                  <div
                    key={u.id}
                    className={`cursor-pointer p-1 rounded hover:bg-blue-100 ${
                      fromConversionUnit === u.id
                        ? "bg-blue-200 font-medium"
                        : ""
                    }`}
                    onClick={() => setFromConversionUnit(u.id)}
                  >
                    {u.name} ({u.symbol})
                  </div>
                ))}
              </div>
            </div>

            {/* To Conversion Boxes */}
            {selectedConversionUnits.map((toUnitId, index) => (
              <div
                key={index}
                className="p-4 rounded shadow flex flex-col gap-3"
                style={{ backgroundColor: theme?.box }}
              >
                {/* Toggle Buttons */}
                <div className="flex justify-center gap-2">
                  <button
                    className={`px-3 py-1 rounded-l ${
                      !conversionToggles[index]
                        ? "text-white"
                        : "bg-white border text-black"
                    }`}
                    style={{
                      borderColor: "#ccc",
                      backgroundColor: !conversionToggles[index]
                        ? primaryColor
                        : "white",
                    }}
                    onClick={() =>
                      setConversionToggles((prev) =>
                        prev.map((t, i) => (i === index ? false : t)),
                      )
                    }
                  >
                    General
                  </button>
                  <button
                    className={`px-3 py-1 rounded-r ${
                      conversionToggles[index]
                        ? "text-white"
                        : "bg-white border text-black"
                    }`}
                    style={{
                      borderColor: "#ccc",
                      backgroundColor: conversionToggles[index]
                        ? primaryColor
                        : "white",
                    }}
                    onClick={() =>
                      setConversionToggles((prev) =>
                        prev.map((t, i) => (i === index ? true : t)),
                      )
                    }
                  >
                    Scientific
                  </button>
                </div>

                {/* Conversion Result */}
                <div className="bg-gray-100 p-3 rounded text-center text-blue-700 font-bold text-base min-h-[48px] flex items-center justify-center">
                  {getConvertedValue(toUnitId) != null &&
                  !isNaN(getConvertedValue(toUnitId))
                    ? `${formatNumber(getConvertedValue(toUnitId), conversionToggles[index])} ${getUnitById(toUnitId)?.symbol || ""}`
                    : getUnitById(toUnitId)?.symbol || ""}
                </div>	

                {/* Unit List */}
                <div className="border rounded max-h-36 overflow-y-auto text-sm bg-white">
                  {units
                    .filter((u) => u.id !== fromConversionUnit)
                    .map((u) => (
                      <div
                        key={u.id}
                        className={`cursor-pointer p-1 hover:bg-blue-100 ${
                          toUnitId === u.id ? "bg-blue-200 font-medium" : ""
                        }`}
                        onClick={() =>
                          setSelectedConversionUnits((prev) =>
                            prev.map((id, i) => (i === index ? u.id : id)),
                          )
                        }
                      >
                        {u.name} ({u.symbol})
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Section */}
      <div className="w-full text-center text-xl font-bold text-gray-700">
        Comparison
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
        {/* From Comparison Block */}
        <div className="flex flex-col items-start justify-start gap-3 bg-white p-4 rounded shadow">
          <select
            value={comparisonValue}
            onChange={(e) => setComparisonValue(e.target.value)}
            className="border px-2 py-2 rounded w-full text-sm min-h-[40px] bg-white"
          >
            <option value={1}>1</option>
            <option value={5}>5</option>
            <option value={10}>10</option>
          </select>

          <div className="border rounded max-h-40 overflow-y-auto w-full text-sm space-y-1 bg-white">
            {units
              .filter((u) => u.name.toLowerCase() === "degree")
              .map((u) => (
                <div
                  key={u.id}
                  className={`cursor-pointer p-1 rounded hover:bg-blue-100 ${
                    fromComparisonUnit === u.id ? "bg-blue-200 font-medium" : ""
                  }`}
                  onClick={() => setFromComparisonUnit(u.id)}
                >
                  {u.name} ({u.symbol})
                </div>
              ))}
          </div>
        </div>

        {/* Comparison Boxes - SAME GRID ROW */}
        {selectedItems.map((selectedItem, index) => {
          const matchedItem = realWorldItems.find(
            (item) =>
              item.angle_degree === comparisonValue.toString() &&
              item.distance_value === selectedItem.distance_value &&
              item.distance_unit === selectedItem.distance_unit,
          );

          return (
            <div
              key={index}
              className="p-4 rounded shadow flex flex-col gap-3"
              style={{ backgroundColor: theme?.box }}
            >
              {/* Toggle Buttons */}
              <div className="flex justify-center gap-2">
                <button
                  className={`px-3 py-1 rounded-l ${
                    !comparisonToggles[index]
                      ? "text-white"
                      : "bg-white border text-black"
                  }`}
                  style={{
                    borderColor: "#ccc",
                    backgroundColor: !comparisonToggles[index]
                      ? primaryColor
                      : "white",
                  }}
                  onClick={() =>
                    setComparisonToggles((prev) =>
                      prev.map((t, i) => (i === index ? false : t)),
                    )
                  }
                >
                  General
                </button>
                <button
                  className={`px-3 py-1 rounded-r ${
                    comparisonToggles[index]
                      ? "text-white"
                      : "bg-white border text-black"
                  }`}
                  style={{
                    borderColor: "#ccc",
                    backgroundColor: comparisonToggles[index]
                      ? primaryColor
                      : "white",
                  }}
                  onClick={() =>
                    setComparisonToggles((prev) =>
                      prev.map((t, i) => (i === index ? true : t)),
                    )
                  }
                >
                  Scientific
                </button>
              </div>
			  
			  {/* Arc Length Heading */}
				<div className="text-center font-semibold text-gray-700 text-sm">
					Arc Length
				</div>

              {/* Comparison Result */}
              <div className="bg-gray-100 p-3 rounded text-center text-blue-700 font-bold text-base min-h-[48px] flex flex-col items-center justify-center leading-snug">
                <div>{matchedItem?.arc_length_value || "No Match"}</div>
                <div className="text-sm text-gray-600 font-medium">
                  {matchedItem?.name || ""}
                </div>
              </div>
			  
			  {/* Distance label + Real World Selector */}
			  <div className="flex items-center gap-2">
                {/* Vertical 'Distance' label */}
				<div className="flex justify-center w-8">
					<span className="text-sm font-semibold text-gray-700 transform -rotate-90">
						Distance
					</span>
				</div>
			 
              <div className="text-sm">
                <AngleRealWorldBox
                  selectedItem={selectedItem}
                  realWorldItems={realWorldItems}
                  outputValue={matchedItem?.arc_length_value || ""}
                  secondLine={matchedItem?.name || ""}
                  unitSymbol={selectedItem?.distance_unit || ""}
                  index={index}
                  handleComparisonDropdownChange={(boxIndex, selectedItem) => {
                    const updated = [...selectedItems];
                    updated[boxIndex] = {
                      distance_value: selectedItem.distance_value,
                      distance_unit: selectedItem.distance_unit,
                    };
                    setSelectedItems(updated);
                  }}
                />
              </div>
            </div>
			</div>
          );
        })}
        {/* Footer note goes here */}
        <div className="col-span-full mt-2">
          <FooterNote theme={theme} />
        </div>
      </div>
    </div>
  );
}

export default AngleConverter;
