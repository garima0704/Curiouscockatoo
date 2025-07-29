// MoleConverter.jsx (Conversion Only)
import React, { useEffect, useState } from "react";
import pb from "../utils/pocketbaseClient";
import { formatNumber } from "../utils/formatNumber";
import { parseScientific } from "../utils/parseScientific";
import { useTheme } from "../context/ThemeContext";

function MoleConverter({ categoryId }) {
  const theme = useTheme();
  const primaryColor = theme?.primary || "#2b66e6";
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [fromUnit, setFromUnit] = useState("");
  const [childUnits, setChildUnits] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [conversionToggles, setConversionToggles] = useState([
    false,
    false,
    false,
  ]);
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [units, setUnits] = useState([]);
  const [topUnits, setTopUnits] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const [fetchedUnits, category] = await Promise.all([
        pb
          .collection("units")
          .getFullList({ filter: `category = "${categoryId}"` }),
        pb.collection("categories").getOne(categoryId),
      ]);

      console.log("Fetched units:", fetchedUnits);
      setUnits(fetchedUnits);

      const top = fetchedUnits.filter((u) => !u.parent_unit);
      console.log("Top-level units:", top);
      setTopUnits(top);
      setCategoryInfo(category);

      const defaultFrom = top[0]?.id || "";
      setFromUnit(defaultFrom);
    };

    fetchData(); // ← now it works correctly
  }, [categoryId]);

  useEffect(() => {
    if (!fromUnit) return;

    const fetchMoleUnits = async () => {
      const [children, items] = await Promise.all([
        pb
          .collection("units")
          .getFullList({ filter: `parent_unit = "${fromUnit}"` }),
        pb.collection("realworld_items").getFullList({
          filter: `unit.parent_unit = "${fromUnit}"`,
          expand: "unit",
        }),
      ]);

      const sortedChildUnits = children.sort(
        (a, b) => a.to_base_factor - b.to_base_factor,
      );

      const safeItems = items.filter((item) => item.unit !== null);

      const getVal = (item) => {
        const approxRaw = item.approx_value?.toString().trim();
        const sciRaw = item.scientific_value?.toString().trim();
        const approx = approxRaw ? parseFloat(approxRaw) : NaN;
        const sci = sciRaw ? parseFloat(parseScientific(sciRaw)) : NaN;

        if ((isNaN(approx) || approx === 0) && (isNaN(sci) || sci === 0))
          return Infinity;
        if (!isNaN(approx) && approx !== 0) return approx;
        if (!isNaN(sci) && sci !== 0) return sci;
        return Infinity;
      };

      const sortedItems = [...safeItems].sort((a, b) => getVal(a) - getVal(b));

      setChildUnits(sortedChildUnits);
      setSelectedUnits(sortedChildUnits.slice(0, 3).map((u) => u.id));
    };

    fetchMoleUnits();
  }, [fromUnit]);

  const getConvertedValue = (toUnitId) => {
    const to = childUnits.find((u) => u.id === toUnitId);
    const input = parseFloat(inputValue);
    if (!to || isNaN(input)) return null;
    return input * to.to_base_factor;
  };

  return (
    <div className="space-y-10">
      {categoryInfo?.top_notes && (
        <div
          className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded text-sm text-gray-800 mb-6"
          dangerouslySetInnerHTML={{ __html: categoryInfo.top_notes }}
        />
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-64 flex flex-col items-center justify-center gap-4">
          <label className="font-semibold text-lg">From</label>
          <div className="relative w-full">
            <input
              type="text"
              value={
                isFocused || !fromUnit
                  ? inputValue
                  : inputValue !== ""
                    ? `${inputValue} ${units.find((u) => u.id === fromUnit)?.symbol || ""}`
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
              placeholder="Enter value"
              className="border p-2 rounded w-full text-left font-mono"
            />
          </div>

          <div className="border rounded max-h-40 overflow-y-auto w-full text-sm space-y-1 bg-white">
            {units
              .filter((u) => !u.parent_unit)
              .map((u) => (
                <div
                  key={u.id}
                  className={`cursor-pointer p-1 rounded hover:bg-blue-100 ${
                    fromUnit === u.id ? "bg-blue-200 font-medium" : ""
                  }`}
                  onClick={() => setFromUnit(u.id)}
                >
                  {u.name} ({u.symbol})
                </div>
              ))}
          </div>
        </div>

        <div className="flex-1 space-y-10">
          {/* Conversion Section */}
          <div>
            <div className="text-center text-xl font-bold text-gray-700 mb-2">
              Conversion
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {selectedUnits.map((toUnitId, index) => {
                const currentUnit = childUnits.find((u) => u.id === toUnitId);
                return (
                  <div
                    key={index}
                    className="p-4 rounded shadow flex flex-col gap-3"
                    style={{ backgroundColor: theme?.box }}
                  >
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
					
					{/* Result */}
                    <div className="bg-gray-100 p-3 rounded text-center text-blue-700 font-bold text-base min-h-[48px]">
						{getConvertedValue(toUnitId) !== null ? (
							<>
							{formatNumber(getConvertedValue(toUnitId), conversionToggles[index])} {currentUnit?.symbol}
							</>
						) : (
						currentUnit?.symbol || ""
						)}
					</div>
				
                    <div className="border rounded max-h-36 overflow-y-auto text-sm bg-white">
                      {childUnits.map((u) => (
                        <div
                          key={u.id}
                          className={`cursor-pointer p-1 hover:bg-blue-100 ${
                            toUnitId === u.id ? "bg-blue-200 font-medium" : ""
                          }`}
                          onClick={() =>
                            setSelectedUnits((prev) =>
                              prev.map((id, i) => (i === index ? u.id : id)),
                            )
                          }
                        >
                          {u.name} ({u.symbol})
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MoleConverter;
