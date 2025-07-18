import React, { useEffect, useState } from "react";
import pb from "../utils/pocketbaseClient";
import RealWorldBox from "./RealWorldBox";
import { formatNumber } from "../utils/formatNumber";
import { useTheme } from "../context/ThemeContext";
import { parseScientific } from "../utils/parseScientific";
import MoleConverter from "./MoleConverter";


function Converter({ categoryId }) {
  const theme = useTheme(); // ✅ Get theme
  const [units, setUnits] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [fromUnit, setFromUnit] = useState("");
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [realWorldItems, setRealWorldItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([null, null, null]);
  const [comparisonToggles, setComparisonToggles] = useState([false, false, false]);
  const [conversionToggles, setConversionToggles] = useState([false, false, false]);
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [childUnits, setChildUnits] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [unitList, category] = await Promise.all([
          pb.collection("units").getFullList({ filter: `category = "${categoryId}"` }),
          pb.collection("categories").getOne(categoryId),
        ]);

        setCategoryInfo(category);

        const sortedUnits = unitList.sort((a, b) => a.to_base_factor - b.to_base_factor);
        setUnits(sortedUnits);

        const topUnits = sortedUnits.filter((u) => !u.parent_unit);
        setFromUnit(topUnits[0]?.id || "");
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    if (categoryId) fetchData();
  }, [categoryId]);



useEffect(() => {
  const fetchChildUnits = async () => {
    if (!fromUnit || !categoryInfo) return;

    const others = units.filter((u) => u.id !== fromUnit);

    const [items] = await Promise.all([
      pb.collection("realworld_items").getFullList({
        filter: `category = "${categoryId}"`,
        expand: "unit",
      }),
    ]);

    // ✅ Utility to extract priority value
    const getPriority = (item) => {
      if (
        item.sort_priority !== undefined &&
        item.sort_priority !== null &&
        !isNaN(item.sort_priority)
      ) {
        return Number(item.sort_priority);
      }
      // Fallback: parse scientific value
      return parseScientific(item.scientific_value) || Infinity;
    };

    // ✅ Sort all real-world items by priority
    const sortedItems = [...items].sort((a, b) => getPriority(a) - getPriority(b));

    // ✅ Use first 3 sorted items for each comparison box
    const defaultItems = sortedItems.slice(0, 3);

    // ✅ Assign them directly to each box in order
    setSelectedItems([
      defaultItems[0] || null, // First box
      defaultItems[1] || null, // Second box
      defaultItems[2] || null, // Third box
    ]);

    // ✅ Set other unit/conversion data
    setChildUnits(others);
    setSelectedUnits(others.slice(0, 3).map((u) => u.id));
    setRealWorldItems(sortedItems);

    // 🛑 DO NOT CALL fetchChildUnits() inside itself!
  };

  // ✅ Correct place to call it
  fetchChildUnits();
}, [fromUnit, categoryInfo]);

 // Delegate to MoleConverter if it's a mole category
  if (categoryInfo?.name.toLowerCase() === "mole") {
    return <MoleConverter categoryId={categoryId} />;
  }

  const getConvertedValue = (toUnitId) => {
    const from = units.find((u) => u.id === fromUnit);
    const to = childUnits.find((u) => u.id === toUnitId);
    if (!from || !to || !inputValue) return null;
    const input = parseFloat(inputValue);

    const baseValue = input * from.to_base_factor;
    return baseValue / to.to_base_factor;
  };

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
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter value"
            className="border p-2 rounded w-full"
          />
          <div className="border rounded max-h-40 overflow-y-auto w-full text-sm space-y-1 bg-white">
            {units.filter((u) => !u.parent_unit).map((u) => (
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
          {units.length > 1 && childUnits.length > 0 && (
            <div>
              <div className="text-center text-xl font-bold text-gray-700 mb-2">Conversion</div>
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
                            !conversionToggles[index] ? "bg-[#FEB73F] text-white" : "bg-white border text-black"
                          }`}
                          style={{ borderColor: "#ccc" }}
                          onClick={() =>
                            setConversionToggles((prev) => prev.map((t, i) => (i === index ? false : t)))
                          }
                        >
                          General
                        </button>
                        <button
                          className={`px-3 py-1 rounded-r ${
                            conversionToggles[index] ? "bg-[#FEB73F] text-white" : "bg-white border text-black"
                          }`}
                          style={{ borderColor: "#ccc" }}
                          onClick={() =>
                            setConversionToggles((prev) => prev.map((t, i) => (i === index ? true : t)))
                          }
                        >
                          Scientific
                        </button>
                      </div>
                      <div className="bg-gray-100 p-3 rounded text-center text-blue-700 font-bold text-base min-h-[48px]">
                        {formatNumber(getConvertedValue(toUnitId), conversionToggles[index])} {currentUnit?.symbol || ""}
                      </div>
                      <div className="border rounded max-h-36 overflow-y-auto text-sm bg-white">
                        {childUnits.map((u) => (
                          <div
                            key={u.id}
                            className={`cursor-pointer p-1 hover:bg-blue-100 ${
                              toUnitId === u.id ? "bg-blue-200 font-medium" : ""
                            }`}
                            onClick={() =>
                              setSelectedUnits((prev) => prev.map((id, i) => (i === index ? u.id : id)))
                            }
                          >
                            {u.name} ({u.symbol}) - {formatNumber(getConvertedValue(u.id), conversionToggles[index])}
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
              <div className="text-center text-xl font-bold text-gray-700 mb-2">Comparison</div>
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
                          !comparisonToggles[index] ? "bg-[#FEB73F] text-white" : "bg-white border text-black"
                        }`}
                        style={{ borderColor: "#ccc" }}
                        onClick={() =>
                          setComparisonToggles((prev) => prev.map((t, i) => (i === index ? false : t)))
                        }
                      >
                        General
                      </button>
                      <button
                        className={`px-3 py-1 rounded-r ${
                          comparisonToggles[index] ? "bg-[#FEB73F] text-white" : "bg-white border text-black"
                        }`}
                        style={{ borderColor: "#ccc" }}
                        onClick={() =>
                          setComparisonToggles((prev) => prev.map((t, i) => (i === index ? true : t)))
                        }
                      >
                        Scientific
                      </button>
                    </div>
                    <div className="bg-gray-100 p-3 rounded text-center text-blue-700 font-bold text-base min-h-[48px]">
                      {selectedItem && inputValue ? (
                        <>
                          {formatNumber(getComparisonValue(selectedItem), comparisonToggles[index])}{" "}
                          {selectedItem?.expand?.unit?.symbol || ""}
                        </>
                      ) : (
                        "..."
                      )}
                    </div>
                    <RealWorldBox
                      selected={selectedItem}
                      setSelected={(val) =>
                        setSelectedItems((prev) => prev.map((item, i) => (i === index ? val : item)))
                      }
                      items={realWorldItems}
                      scientificToggle={true}
                    />
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
