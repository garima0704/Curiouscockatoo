import React, { useEffect, useState } from "react";
import pb from "../utils/pocketbaseClient";
import RealWorldBox from "./RealWorldBox";
import { useTheme } from "../context/ThemeContext";
import { formatNumber } from "../utils/formatNumber";
import { distributeBlankCards } from "../utils/blankCardDistributor";
import FooterNote from "./FooterNote";

function RefractiveIndexConverter({ categoryId }) {
  const theme = useTheme();
  const primaryColor = theme?.primary || "#2b66e6";

  const [inputValue, setInputValue] = useState("");
  const [realWorldItems, setRealWorldItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([null, null, null]);
  const [comparisonToggles, setComparisonToggles] = useState([
    false,
    false,
    false,
  ]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRealWorldItems = async () => {
      try {
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
        setRealWorldItems(enrichedItems);

        // Set default selected items (e.g., first 3 items)
        setSelectedItems(enrichedItems.slice(0, 3));
      } catch (err) {
        console.error("Failed to load real world items:", err);
      }
    };

    fetchRealWorldItems();
  }, [categoryId]);

  const getComparisonValue = (item) => {
    if (!item?.approx_value || !inputValue) return null;
    const input = parseFloat(inputValue);
    return input / item.approx_value;
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Input Section (Left Side) */}
        <div className="w-full lg:w-1/4 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center w-full">
            <input
              type="text"
              inputMode="decimal"
              placeholder="Enter value between 1 to 6"
              className={`border p-2 rounded w-full text-center font-mono ${
                error ? "border-red-500" : "border-gray-300"
              }`}
              value={inputValue}
              onChange={(e) => {
                const val = e.target.value;
                const regex = /^([1-5](\.\d{0,6})?|6(\.0{0,6})?)$/;

                if (val === "" || regex.test(val)) {
                  setInputValue(val);
                  setError("");
                } else {
                  setInputValue(val);
                  setError("Please enter a number between 1 and 6.");
                }
              }}
            />
            {error && (
              <p className="text-red-600 text-sm mt-2 text-center">{error}</p>
            )}
          </div>
        </div>

        {/* Comparison Boxes (Right Side) */}
        <div className="w-full lg:flex-1 space-y-6">
          {realWorldItems.length > 0 && (
            <>
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

                    {/* Result Box */}
                    <div className="bg-gray-100 p-3 rounded text-center text-blue-700 font-bold text-base min-h-[48px]">
                      {selectedItem && inputValue && !error ? (
                        <>
                          {formatNumber(
                            getComparisonValue(selectedItem),
                            comparisonToggles[index],
                          )}
                        </>
                      ) : (
                        " "
                      )}
                    </div>

                    {/* RealWorld Items */}
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
              {/* Footer note goes here */}
              <div className="col-span-full mt-2">
                <FooterNote theme={theme} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default RefractiveIndexConverter;
