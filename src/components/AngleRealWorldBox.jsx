import React from "react";

function AngleRealWorldBox({
  selectedItem,
  realWorldItems = [],
  index,
  handleComparisonDropdownChange,
}) {
  // Deduplicate + Sort by distance_value ascending
  const uniqueSortedItems = Array.from(
    new Map(
      realWorldItems.map((item) => [
        `${item.distance_value}-${item.distance_unit}`,
        item,
      ])
    ).values()
  ).sort((a, b) => a.distance_value - b.distance_value);

  return (
    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
      {uniqueSortedItems.map((item, i) => {
        const isSelected =
          selectedItem?.distance_value === item.distance_value &&
          selectedItem?.distance_unit === item.distance_unit;

        return (
          <div
            key={i}
            onClick={() => handleComparisonDropdownChange(index, item)}

            className={`flex items-center justify-center text-base font-semibold text-blue-800 text-center cursor-pointer border py-3 px-3 rounded shadow-sm transition-colors duration-200 ${
              isSelected
                ? "bg-blue-50 border-blue-400"
                : "bg-white border-gray-300"
            }`}
          >
            {item.distance_value} {item.distance_unit}
          </div>
        );
      })}
    </div>
  );
}

export default AngleRealWorldBox;
