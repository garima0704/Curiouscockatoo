// MoleConverter.jsx
import React, { useEffect, useState } from "react";
import pb from "../utils/pocketbaseClient";
import RealWorldBox from "./RealWorldBox";
import { formatNumber } from "../utils/formatNumber";
import { parseScientific } from "../utils/parseScientific";
import { useTheme } from "../context/ThemeContext";

function MoleConverter({ categoryId }) {
  const theme = useTheme();
  const [inputValue, setInputValue] = useState("");
  const [units, setUnits] = useState([]);
  const [fromUnit, setFromUnit] = useState("");
  const [childUnits, setChildUnits] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [realWorldItems, setRealWorldItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([null, null, null]);
  const [comparisonToggles, setComparisonToggles] = useState([false, false, false]);
  const [conversionToggles, setConversionToggles] = useState([false, false, false]);
  const [categoryInfo, setCategoryInfo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const [unitList, category] = await Promise.all([
        pb.collection("units").getFullList({ filter: `category = "${categoryId}"` }),
        pb.collection("categories").getOne(categoryId),
      ]);

      setUnits(unitList);
      setCategoryInfo(category);

      const topUnits = unitList.filter((u) => !u.parent_unit);
      setFromUnit(topUnits[0]?.id || "");
    };

    fetchData();
  }, [categoryId]);

  useEffect(() => {
          if (!fromUnit) return;
const fetchMoleUnits = async () => {
      const [childs, items] = await Promise.all([
        pb.collection("units").getFullList({ filter: `parent_unit = "${fromUnit}"` }),
        pb.collection("realworld_items").getFullList({
          filter: `unit.parent_unit = "${fromUnit}"`,
          expand: "unit",
        }),
      ]);

      const sortedChilds = childs.sort((a, b) => a.to_base_factor - b.to_base_factor);

      const getPriority = (item) =>
        item.sort_priority != null
          ? item.sort_priority
          : parseScientific(item.scientific_value);

      const sortedItems = [...items].sort((a, b) => getPriority(a) - getPriority(b));

      const defaultItems = sortedItems.filter(
        (item) => !item.name.toLowerCase().includes("black hole")
      );

      setChildUnits(sortedChilds);
      setSelectedUnits(sortedChilds.slice(0, 3).map((u) => u.id));
      setRealWorldItems(sortedItems);
      setSelectedItems([
        defaultItems[0] || null,
        defaultItems[1] || null,
        defaultItems[2] || null,
      ]);
    };

    fetchMoleUnits();
  }, [fromUnit]);

  const getConvertedValue = (toUnitId) => {
    const to = childUnits.find((u) => u.id === toUnitId);
    const input = parseFloat(inputValue);
    if (!to || isNaN(input)) return null;
    return input * to.to_base_factor;
  };

  const getComparisonValue = (item) => {
    const from = units.find((u) => u.id === fromUnit);
    const input = parseFloat(inputValue);
    if (!from || !item?.approx_value || isNaN(input)) return null;

    const realValue = input * from.to_base_factor;
    return realValue / item.approx_value;
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
        {/* Input */}
        <div className="w-full lg:w-64 flex flex-col items-center justify-center gap-4">
          <label className="font-semibold text-lg">From</label>
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter value"
            className="border p-2 rounded w-full"
          />
          <div className="border rounded max-h-40 overflow-y-auto w-full text-sm bg-white">
            {units.filter((u) => !u.parent_unit).map((u) => (
              <div
                key={u.id}
                className={`cursor-pointer p-1 hover:bg-blue-100 ${
                  fromUnit === u.id ? "bg-blue-200 font-medium" : ""
                }`}
                onClick={() => setFromUnit(u.id)}
              >
                {u.name} ({u.symbol})
              </div>
            ))}
          </div>
        </div>

        {/* Conversion & Comparison */}
        <div className="flex-1 space-y-10">
          {/* Conversion Section */}
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
                      {formatNumber(getConvertedValue(toUnitId), conversionToggles[index])} {currentUnit?.symbol}
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
                              prev.map((id, i) => (i === index ? u.id : id))
                            )
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

{/* Comparison Section */}
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

export default MoleConverter;
