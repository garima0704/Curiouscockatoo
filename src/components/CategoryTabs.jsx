import React from "react";

const toTitleCase = (slug) =>
  slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export default function CategoryTabs({ mainCategories, active, onChange, theme }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 mb-6">
      {mainCategories.map((slug) => (
        <button
          key={slug}
          onClick={() => onChange(slug)}
		  role="tab"
          aria-selected={active === slug}
          className={`text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2 min-w-[44px] min-h-[44px] rounded font-semibold border transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 ${
            active === slug
              ? "text-white border-transparent"
              : "text-gray-700 bg-white border border-gray-300 hover:bg-blue-50"
          }`}
          style={{
            backgroundColor: active === slug ? theme?.primary : undefined,
          }}
        >
          {toTitleCase(slug)}
        </button>
      ))}
    </div>
  );
}
