import React from "react";
import { formatNumberString } from "../utils/formatNumber";
import { angleUnits } from "../data/angleUnits";

function AngleRealWorldBox({
  selectedItem,
  realWorldItems = [],
  index,
  handleComparisonDropdownChange,
}) {
  // Convert any item into meters using angleUnits
  const getConvertedMeters = (item) => {
    const val = parseFloat(item.distance_value);
    const unit = angleUnits.find((u) => u.symbol === item.distance_unit);
    return unit ? val * unit.to_base_factor : Infinity;
  };

  // Deduplicate and sort properly
  const uniqueSortedItems = Array.from(
    new Map(
      realWorldItems.map((item) => [
        `${item.distance_value}-${item.distance_unit}`,
        item,
      ]),
    ).values(),
  ).sort((a, b) => getConvertedMeters(a) - getConvertedMeters(b));

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
            className={`flex flex-col items-center justify-center text-base font-semibold text-blue-800 text-center cursor-pointer border py-3 px-3 rounded shadow-sm transition-colors duration-200 ${
              isSelected
                ? "bg-blue-50 border-blue-400"
                : "bg-white border-gray-300"
            }`}
          >
            {/* Line 1: Distance + Unit */}
            <div>
              {formatNumberString(item.distance_value, false, true)}{" "}
              {item.distance_unit}
            </div>

            {/* Line 2: Notes (if any) */}
            {item.notes && (
              <div
                className="text-sm text-gray-600 font-medium mt-1 text-center [&_p]:my-1"
                dangerouslySetInnerHTML={{ __html: item.notes }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default AngleRealWorldBox;
