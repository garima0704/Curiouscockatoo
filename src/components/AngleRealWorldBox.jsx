import React from "react";
import { useTranslation } from "react-i18next";
import { formatNumberString } from "../utils/formatNumber";
import { angleUnits } from "../data/angleUnits";

function AngleRealWorldBox({ selectedItem, realWorldItems = [], index, handleComparisonDropdownChange }) {
  const { i18n } = useTranslation();
  const lang = i18n.language || "en";

  const getConvertedMeters = (item) => {
    const val = parseFloat(item.distance_value);
    const unit = angleUnits.find((u) => u.symbol === item.distance_unit);
    return unit && !isNaN(val) ? val * (unit.to_base_factor ?? 1) : Infinity;
  };

  const normalized = realWorldItems.map((it) => ({
    ...it,
    localizedName:
      it.localizedName ??
      (lang === "es" ? it.name_es || it.name_en || it.name : it.name_en || it.name_es || it.name),
    localizedNotes:
      it.localizedNotes ??
      (lang === "es" ? it.notes_es || it.notes_en || it.notes : it.notes_en || it.notes_es || it.notes),
  }));

  const uniqueSortedItems = Array.from(
    new Map(normalized.map((item) => [`${item.distance_value}-${item.distance_unit}`, item])).values()
  ).sort((a, b) => getConvertedMeters(a) - getConvertedMeters(b));

  return (
    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
      {uniqueSortedItems.map((item) => {
        const isSelected =
          selectedItem &&
          Number(selectedItem.distance_value) === Number(item.distance_value) &&
          selectedItem.distance_unit === item.distance_unit;

        return (
          <div
            key={`${item.distance_value}-${item.distance_unit}`}
            onClick={() => handleComparisonDropdownChange(index, item)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleComparisonDropdownChange(index, item);
            }}
            className={`flex flex-col items-center justify-center text-base font-semibold text-blue-800 text-center cursor-pointer border py-3 px-3 rounded shadow-sm transition-colors duration-200 ${
              isSelected ? "bg-blue-50 border-blue-400" : "bg-white border-gray-300"
            }`}
          >
            {/* Distance + Unit */}
            <div>
              {formatNumberString(Number(item.distance_value) || 0, false, true)} {item.distance_unit}
            </div>

            {/* Localized Notes */}
            {item.localizedNotes && (
              <div
                className="text-sm text-gray-600 font-medium mt-1 text-center [&_p]:my-1"
                dangerouslySetInnerHTML={{ __html: item.localizedNotes }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default AngleRealWorldBox;
