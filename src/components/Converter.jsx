import React, { useEffect, useState } from "react";
import pb from "../utils/pocketbaseClient";
import RealWorldBox from "./RealWorldBox";
import { formatNumber } from "../utils/formatNumber";
import { useTheme } from "../context/ThemeContext";
import { parseScientific } from "../utils/parseScientific";
import MoleConverter from "./MoleConverter";
import RefractiveIndexConverter from "./RefractiveIndexConverter";
import AngleConverter from "./AngleConverter";
import { distributeBlankCards } from "../utils/blankCardDistributor";

function Converter({ categoryId }) {
  const theme = useTheme();
  const primaryColor = theme?.primary || "#2b66e6";
  const [units, setUnits] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [fromUnit, setFromUnit] = useState("");
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [realWorldItems, setRealWorldItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([null, null, null]);
  const [comparisonToggles, setComparisonToggles] = useState([
    false,
    false,
    false,
  ]);
  const [conversionToggles, setConversionToggles] = useState([
    false,
    false,
    false,
  ]);
  const [categoryInfo, setCategoryInfo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [unitList, category] = await Promise.all([
          pb
            .collection("units")
            .getFullList({ filter: `category = "${categoryId}"` }),
          pb.collection("categories").getOne(categoryId),
        ]);
        setCategoryInfo(category);

        const sortedUnits = unitList.sort(
          (a, b) => a.to_base_factor - b.to_base_factor,
        );
        setUnits(sortedUnits);

        const defaultFromUnit = sortedUnits[0]?.id || "";
        setFromUnit(defaultFromUnit);

        // Initialize 3 conversion boxes
        const defaultConversions = sortedUnits
          .filter((u) => u.id !== defaultFromUnit)
          .slice(0, 3)
          .map((u) => u.id);
        setSelectedUnits(defaultConversions);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };
    if (categoryId) fetchData();
  }, [categoryId]);

  useEffect(() => {
    const fetchRealWorldItems = async () => {
      const response = await pb.collection("realworld_items").getFullList({
        filter: `category = "${categoryId}"`,
        expand: "unit",
      });

      const withExponents = response.map((item) => {
        const value = parseFloat(item.scientific_value);
        const exponent = isNaN(value)
          ? null
          : Math.floor(Math.log10(Math.abs(value)));
        return { ...item, exponent };
      });

      const safeItems = withExponents.filter(
        (item) => item.exponent !== null && !isNaN(item.exponent),
      );

      const enrichedItems = distributeBlankCards(safeItems, 9);
      
	  // Sort items by power and approx_value within each power
      enrichedItems.sort((a, b) => {
        if (a.power !== b.power) return a.power - b.power;

        const aApprox = a.approx_value ?? Infinity;
        const bApprox = b.approx_value ?? Infinity;

        return aApprox - bApprox;
      });
      setRealWorldItems(enrichedItems);
    };

    fetchRealWorldItems();
  }, [categoryId]);

  // Delegete to their respective category page
  const categoryName = categoryInfo?.name.toLowerCase();
  if (categoryName === "mole") return <MoleConverter categoryId={categoryId} />;
  if (categoryName === "refractive index")
    return <RefractiveIndexConverter categoryId={categoryId} />;
  if (categoryName === "angle")
    return <AngleConverter categoryId={categoryId} />;

  const getConvertedValue = (toUnitId) => {
    const from = units.find((u) => u.id === fromUnit);
    const to = units.find((u) => u.id === toUnitId);
    if (!from || !to || !inputValue) return null;
    const input = parseFloat(inputValue);
    const baseValue = input * from.to_base_factor;
    return baseValue / to.to_base_factor;
  };

  const getUnitById = (id) => units.find((u) => u.id === id);

  const getComparisonValue = (item) => {
    if (!item || !item.approx_value || !inputValue) return null;
    const from = units.find((u) => u.id === fromUnit);
    if (!from) return null;
    const input = parseFloat(inputValue);
    const baseValue = input * from.to_base_factor;
    return baseValue / item.approx_value;
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
            {units.map((u) => (
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
          {/* Conversion */}
          {units.length > 1 && (
            <div className="mx-auto" style={{ maxWidth: "52rem" }}>
              <div className="text-center text-xl font-bold text-gray-700 mb-2">
                Conversion
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {selectedUnits.map((toUnitId, index) => {
                  const currentUnit = units.find((u) => u.id === toUnitId);
                  return (
                    <div
                      key={index}
                      className="p-4 rounded shadow flex flex-col gap-3"
                      style={{ backgroundColor: theme?.box }}
                    >
                      {/* Toggle buttons */}
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
                      <div className="bg-gray-100 p-3 rounded text-center text-blue-700 font-bold text-base min-h-[48px] flex items-center justify-center">
                        {formatNumber(
                          getConvertedValue(toUnitId),
                          conversionToggles[index],
                        )}{" "}
                        {getUnitById(toUnitId)?.symbol || ""}
                      </div>

                      {/* Unit selection */}
                      <div className="border rounded max-h-36 overflow-y-auto text-sm bg-white">
                        {units
                          .filter((u) => u.id !== fromUnit)
                          .map((u) => (
                            <div
                              key={u.id}
                              className={`cursor-pointer p-1 hover:bg-blue-100 ${
                                toUnitId === u.id
                                  ? "bg-blue-200 font-medium"
                                  : ""
                              }`}
                              onClick={() =>
                                setSelectedUnits((prev) =>
                                  prev.map((id, i) =>
                                    i === index ? u.id : id,
                                  ),
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
          )}

          {/* Comparison */}
          {realWorldItems.length > 0 && (
            <div>
              <div className="text-center text-xl font-bold text-gray-700 mb-2">
                Comparison
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {selectedItems.map((selectedItem, index) => (
                  <div
                    key={index}
                    className="p-4 rounded shadow flex flex-col gap-3"
                    style={{ backgroundColor: theme?.box }}
                  >
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

                    <div className="bg-gray-100 p-3 rounded text-center text-blue-700 font-bold text-base min-h-[48px]">
                      {selectedItem && inputValue
                        ? formatNumber(
                            getComparisonValue(selectedItem),
                            comparisonToggles[index],
                          )
                        : ""}
                    </div>
                    <div className="h-[300px] overflow-y-auto pr-1">
                      <RealWorldBox
                        selected={selectedItem}
                        setSelected={(val) =>
                          setSelectedItems((prev) =>
                            prev.map((item, i) => (i === index ? val : item)),
                          )
                        }
                        items={realWorldItems}
                        scientificToggle={true}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Converter;
