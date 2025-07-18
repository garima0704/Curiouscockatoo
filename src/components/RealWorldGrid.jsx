// RealWorldGrid.jsx
import React, { useState } from "react";
import { formatNumber } from "../utils/formatNumber";

const ITEMS_PER_PAGE = 5;

function RealWorldGrid({ items, inputValue }) {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const sorted = [...items].sort((a, b) => a.scientific_value - b.scientific_value);
  const visibleItems = sorted.slice(0, visibleCount);

  const handleLoadMore = () => setVisibleCount((prev) => prev + ITEMS_PER_PAGE);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {visibleItems.map((item) => {
          const result = inputValue && item.scientific_value
            ? inputValue / item.scientific_value
            : null;

          return (
            <div key={item.id} className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="text-xl font-bold text-blue-600 text-center mb-2">
                {formatNumber(result)}
              </div>
              <div className="text-center font-semibold mb-1">{item.name}</div>
              <div className="text-sm flex justify-between text-gray-600">
                <span>{formatNumber(item.scientific_value, true)}</span>
                <span>{item.expand?.unit?.symbol}</span>
              </div>
              {item.notes && (
                <div className="text-xs italic text-gray-500 mt-2 text-center">
                  {item.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {visibleCount < sorted.length && (
        <div className="text-center mt-4">
          <button
            onClick={handleLoadMore}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}

export default RealWorldGrid;
