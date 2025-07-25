import React, { useEffect, useState } from "react";
import pb from "../utils/pocketbaseClient";
import RealWorldBox from "./RealWorldBox";
import { useTheme } from "../context/ThemeContext";
import { formatNumber } from "../utils/formatNumber";
import { parseScientific } from "../utils/parseScientific";
import { distributeBlankCards } from "../utils/blankCardDistributor";

function RefractiveIndexConverter({ categoryId }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [scientificToggle, setScientificToggle] = useState(true);
  const theme = useTheme();

  useEffect(() => {
  const fetchRealWorldItems = async () => {
    if (!fromUnit) return;

    try {
      const items = await pb.collection("realworld_items").getFullList({
        filter: `category.id = "${categoryId}"`,  // ✅ Correct relational filter
        expand: "unit",
      });

      const getVal = (item) => {
        if (item.force_last_position) return Infinity;
        if (item.is_blank_card) return item.blank_position ?? Infinity;

        const approx = parseFloat(item?.approx_value);
        const sci = parseFloat(item?.scientific_value);

        const isInvalid =
          (isNaN(approx) && isNaN(sci)) || (!isFinite(approx) && !isFinite(sci));

        if (isInvalid) return Infinity;
        if (!isNaN(approx) && isFinite(approx)) return approx;
        if (!isNaN(sci) && isFinite(sci)) return sci;

        return Infinity;
      };

      // Step 1: Sort items by value
      const sortedItems = items.sort((a, b) => getVal(a) - getVal(b));

      // Step 2: Add exponent (power)
      const withExponent = sortedItems.map((item) => ({
        ...item,
        power: Math.floor(Math.log10(parseScientific(item.scientific_value))),
      }));

      // Step 3: Distribute blank cards
      const enrichedItems = distributeBlankCards(withExponent);

      // Step 4: Final sort - force_last_position at bottom
      const finalItems = enrichedItems.sort((a, b) => {
        if (a.force_last_position && !b.force_last_position) return 1;
        if (!a.force_last_position && b.force_last_position) return -1;
        return a.power - b.power;
      });

      // Step 5: Set to state
      setRealWorldItems(finalItems);

      // Step 6: Default top 3 items (not blank/invalid/forced last)
      const top3 = finalItems
        .filter(
          (item) =>
            !item.is_blank_card &&
            !item.force_last_position &&
            getVal(item) !== Infinity
        )
        .slice(0, 3);

      setSelectedItems(top3);
    } catch (err) {
      console.error("Failed to fetch real-world items:", err);
    }
  };

  fetchRealWorldItems();
}, [fromUnit]);


  return (
   <>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {selectedItems.map((item, index) => (
    <div className="p-4 shadow rounded">
      <RealWorldBox
        selected={item}
        setSelected={(val) =>
          setSelectedItems((prev) =>
            prev.map((i, idx) => (idx === index ? val : i)),
          )
        }
        items={realWorldItems}
        scientificToggle={true}
      />
    </div>
  ))}
</div>


      <div className="flex flex-col w-full md:w-1/2">
        <h3 className="text-lg font-semibold mb-2 text-blue-800">Comparison Result</h3>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-300">
          {selected ? (
            <>
              <div className="text-blue-800 font-semibold text-lg text-center mb-2">{selected.name}</div>
              <div className="text-center text-2xl text-blue-700 font-mono mb-2">
                {scientificToggle
                  ? parseScientific(selected.value_si)
                  : formatNumber(selected.value_normal)}
              </div>
              {selected.notes && (
                <div
                  className="prose prose-sm max-w-none mt-2 text-gray-600 [&_p]:my-1 [&_ul]:my-1 [&_li]:my-1 [&> :last-child]:mb-0"
                  dangerouslySetInnerHTML={{ __html: selected.notes }}
                />
              )}
            </>
          ) : (
            <p className="text-gray-500 text-center">Select an item to see details.</p>
          )}
        </div>

        <div className="mt-4 flex justify-center">
          <button
            className={`px-4 py-1 rounded-l border text-sm ${
              scientificToggle
                ? `bg-[${theme?.primary}] text-white`
                : "bg-gray-200 text-gray-800"
            }`}
            onClick={() => setScientificToggle(true)}
          >
            Scientific
          </button>
          <button
            className={`px-4 py-1 rounded-r border text-sm ${
              !scientificToggle
                ? `bg-[${theme?.primary}] text-white`
                : "bg-gray-200 text-gray-800"
            }`}
            onClick={() => setScientificToggle(false)}
          >
            General
          </button>
        </div>
      </div>
    </>
  );
}

export default RefractiveIndexConverter;
