import React, { useEffect, useState } from "react";
import pb from "../utils/pocketbaseClient";
import RealWorldBox from "./RealWorldBox";
import { useTheme } from "../context/ThemeContext";
import FooterNote from "./FooterNote";

function SoundLevelConverter({ categoryId }) {
  const theme = useTheme();
  const primaryColor = theme?.primary || "#2b66e6";

  const [units, setUnits] = useState([]);
  const [fromUnit, setFromUnit] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [realWorldItems, setRealWorldItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([null, null]);
  const [filteredItems, setFilteredItems] = useState([[], []]);

  // Fetch units
  useEffect(() => {
    const fetchUnits = async () => {
      const unitList = await pb
        .collection("units")
        .getFullList({ filter: `category = "${categoryId}"` });
      setUnits(unitList);
      setFromUnit(unitList[0]?.id || "");
    };
    if (categoryId) fetchUnits();
  }, [categoryId]);

  // Fetch real-world items
  useEffect(() => {
    const fetchRealWorldItems = async () => {
      const response = await pb.collection("realworld_items").getFullList({
        filter: `category = "${categoryId}"`,
        expand: "unit",
      });

      const validItems = response.filter(
        (item) =>
          !isNaN(parseFloat(item.approx_value || item.scientific_value))
      );

      setRealWorldItems(validItems);
      setFilteredItems([validItems, validItems]); // default all items
      setSelectedItems([validItems[0] || null, validItems[0] || null]);
    };

    if (categoryId) fetchRealWorldItems();
  }, [categoryId]);

  // Update selected items when input changes
useEffect(() => {
  if (inputValue === "" || inputValue === "-") {
    // Default: show all items in both boxes
    setFilteredItems([realWorldItems, realWorldItems]);
    setSelectedItems([realWorldItems[0] || null, realWorldItems[0] || null]);
    return;
  }

  const input = parseFloat(inputValue);
  if (isNaN(input) || input < -30 || input > 310) {
    setSelectedItems([null, null]);
    setFilteredItems([[], []]);
    return;
  }

  // ✅ Fixed 10-interval range
  let start, end;
  if (input >= -30 && input <= 0) {
    start = -30;
    end = 0;
  } else {
    const rangeSize = 10;
    start = Math.floor((input - 1) / rangeSize) * rangeSize + 1;
    end = start + rangeSize - 1;
  }

  const itemsInRange = realWorldItems.filter((item) => {
    const value = parseFloat(item.approx_value || item.scientific_value);
    return value >= start && value <= end;
  });

  if (itemsInRange.length === 0) {
    setSelectedItems([null, null]);
    setFilteredItems([[], []]);
    return;
  }

  // Find low & high
  const minItem = itemsInRange.reduce((min, curr) =>
    parseFloat(curr.approx_value || curr.scientific_value) <
    parseFloat(min.approx_value || min.scientific_value)
      ? curr
      : min
  );

  const maxItem = itemsInRange.reduce((max, curr) =>
    parseFloat(curr.approx_value || curr.scientific_value) >
    parseFloat(max.approx_value || max.scientific_value)
      ? curr
      : max
  );

  const boxes = [];
  const filtered = [];
  if (minItem) {
    boxes.push(minItem);
    filtered.push(itemsInRange);
  }
  if (maxItem && maxItem !== minItem) {
    boxes.push(maxItem);
    filtered.push(itemsInRange);
  }

  setSelectedItems(boxes);
  setFilteredItems(filtered);
}, [inputValue, realWorldItems]);


  return (
    <div className="space-y-10 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side Input */}
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
  placeholder="Enter value (-30 to 310)"
  className="border p-2 rounded w-full text-left font-mono"
/>




          {/* Unit selector */}
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

        {/* Right Side Boxes */}
        <div className="flex-1 space-y-10">
          <div>
            <div className="text-center text-xl font-bold text-gray-700 mb-2">
              Comparison
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selectedItems.map((selectedItem, index) =>
                selectedItem ? (
                  <div
                    key={index}
                    className="w-full p-4 rounded shadow flex flex-col gap-3"
                    style={{ backgroundColor: theme?.box }}
                  >
                    {/* Reference Heading */}
                    <div className="text-center font-semibold text-gray-800">
                      Reference
                    </div>

                    {/* Result Box */}
                    <div className="overflow-x-auto max-w-full">
                      <div className="bg-gray-100 p-3 rounded text-center text-blue-700 font-bold text-sm sm:text-base min-h-[48px] flex flex-col items-center justify-center">
                        {selectedItem && (
                          <>
                            {parseFloat(
                              selectedItem.approx_value ||
                                selectedItem.scientific_value
                            )}{" "}
                            {selectedItem.expand?.unit?.symbol || ""}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Dropdown */}
                    <div className="h-[300px] overflow-y-auto pr-1 max-h-[80vh]">
                      <RealWorldBox
                        selected={selectedItem}
                        setSelected={(val) =>
                          setSelectedItems((prev) =>
                            prev.map((item, i) => (i === index ? val : item))
                          )
                        }
                        items={filteredItems[index]}
                        scientificToggle={false}
                      />
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SoundLevelConverter;
