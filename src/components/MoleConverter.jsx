// MoleConverter.jsx (Refined Version)
import React, { useEffect, useState } from "react";
import pb from "../utils/pocketbaseClient";
import { formatNumber } from "../utils/formatNumber";
import { parseScientific } from "../utils/parseScientific";
import { useTheme } from "../context/ThemeContext";
import FooterNote from "./FooterNote";

function MoleConverter({ categoryId }) {
  const theme = useTheme();
  const primaryColor = theme?.primary || "#2b66e6";

  const [inputValues, setInputValues] = useState(["", "", ""]);
  const [fromUnits, setFromUnits] = useState([null, null, null]);
  const [childUnits, setChildUnits] = useState([[], [], []]);
  const [selectedUnits, setSelectedUnits] = useState([null, null, null]);
  const [conversionToggles, setConversionToggles] = useState([
    false,
    false,
    false,
  ]);
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [units, setUnits] = useState([]);
  const [topUnits, setTopUnits] = useState([]);
  const [isChildLoading, setIsChildLoading] = useState(false);

  const assignedParentUnitIds = topUnits.slice(0, 3).map((u) => u.id);

  const handleInputChange = (index, value) => {
    const updated = [...inputValues];
    updated[index] = value;
    setInputValues(updated);
  };

  const handleFromUnitChange = (index, unitId) => {
    const updated = [...fromUnits];
    updated[index] = unitId;
    setFromUnits(updated);
  };

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      const [fetchedUnits, category] = await Promise.all([
        pb
          .collection("units")
          .getFullList({ filter: `category = "${categoryId}"` }),
        pb.collection("categories").getOne(categoryId),
      ]);

      if (cancelled) return;

      setUnits(fetchedUnits);
      setCategoryInfo(category);

      const top = fetchedUnits.filter((u) => !u.parent_unit);
      setTopUnits(top);
      setFromUnits(top.slice(0, 3).map((u) => u?.id || null));
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  useEffect(() => {
    if (fromUnits.filter(Boolean).length < 3 || units.length === 0) return;

    const fetchAllChildUnits = async () => {
      setIsChildLoading(true);

      const results = await Promise.all(
        fromUnits.map(async (unitId, index) => {
          if (!unitId) return { index, children: [] };

          const children = await pb
            .collection("units")
            .getFullList({ filter: `parent_unit = "${unitId}"` });

          return {
            index,
            children: children.sort(
              (a, b) => a.to_base_factor - b.to_base_factor,
            ),
          };
        }),
      );

      const updatedChildUnits = [...childUnits];
      const updatedSelectedUnits = [...selectedUnits];

      results.forEach(({ index, children }) => {
        updatedChildUnits[index] = children;
        updatedSelectedUnits[index] = children[0]?.id || null;
      });

      setChildUnits(updatedChildUnits);
      setSelectedUnits(updatedSelectedUnits);
      setIsChildLoading(false);
    };

    fetchAllChildUnits();
  }, [fromUnits, units]);

  const getConvertedValue = (value, _from, to) => {
    const num = parseScientific(value);
    if (!to || typeof to.to_base_factor !== "number" || isNaN(num)) return null;
    return num * to.to_base_factor;
  };

  return (
    <div className="space-y-10">
      {categoryInfo?.top_notes && (
        <div
          className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded text-sm text-gray-800 mb-6"
          dangerouslySetInnerHTML={{ __html: categoryInfo.top_notes }}
        />
      )}

      <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
        Volume Comparison
      </h2>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {[0, 1, 2].map((index) => {
          const fromUnitId = fromUnits[index];
          const fromUnit = units.find((u) => u.id === fromUnitId);
          const children = childUnits[index] || [];
          const toUnitId = selectedUnits[index];
          const currentUnit = children.find((u) => u.id === toUnitId);

          const input = inputValues[index];
          const result = getConvertedValue(input, fromUnit, currentUnit);

          return (
            <div
              key={index}
              className="w-full lg:w-1/3 flex flex-col gap-4 border rounded p-4 bg-white shadow min-h-[200px]"
            >
              {/* Input */}
              <input
                type="text"
                value={input}
                onChange={(e) => {
                  const raw = e.target.value.match(/^-?\d*\.?\d*/)?.[0] || "";
                  if (raw === "" || (!isNaN(raw) && parseFloat(raw) >= 0)) {
                    handleInputChange(index, raw);
                  }
                }}
                placeholder="Enter value"
                className="border p-2 rounded w-full text-left font-mono"
              />

              {/* Parent Dropdown */}
              <div className="border rounded max-h-40 overflow-y-auto w-full text-sm space-y-1 bg-white">
                {units
                  .filter((u) => u.id === assignedParentUnitIds[index])
                  .map((u) => (
                    <div
                      key={u.id}
                      className={`cursor-pointer p-1 rounded hover:bg-blue-100 ${fromUnitId === u.id ? "bg-blue-200 font-medium" : ""}`}
                      onClick={() => handleFromUnitChange(index, u.id)}
                    >
                      {u.name} ({u.symbol})
                    </div>
                  ))}
              </div>

              {/* Toggle Buttons */}
              <div className="flex justify-center gap-2 mb-2">
                {["General", "Scientific"].map((label, i) => (
                  <button
                    key={label}
                    className={`px-3 py-1 ${i === 0 ? "rounded-l" : "rounded-r"} ${
                      conversionToggles[index] === (i === 1)
                        ? "text-white"
                        : "bg-white border text-black"
                    }`}
                    style={{
                      borderColor: "#ccc",
                      backgroundColor:
                        conversionToggles[index] === (i === 1)
                          ? primaryColor
                          : "white",
                    }}
                    onClick={() =>
                      setConversionToggles((prev) =>
                        prev.map((t, j) => (j === index ? i === 1 : t)),
                      )
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Result */}
              <div className="bg-gray-100 p-3 rounded text-center text-blue-700 font-bold text-base min-h-[48px]">
                <div className="break-words whitespace-normal leading-snug w-full">
                  {typeof currentUnit?.to_base_factor === "number" && input ? (
                    <>
                      {conversionToggles[index]
                        ? formatNumber(result, true)
                        : formatNumber(result, false)}{" "}
                      {currentUnit?.symbol || ""}
                    </>
                  ) : (
                    <>{currentUnit?.symbol || ""}</>
                  )}
                </div>
              </div>

              {/* Child Unit Selector */}
              <div className="border rounded max-h-36 overflow-y-auto text-sm bg-white mt-2">
                {children.map((u) => (
                  <div
                    key={u.id}
                    className={`cursor-pointer p-1 hover:bg-blue-100 ${toUnitId === u.id ? "bg-blue-200 font-medium" : ""}`}
                    onClick={() =>
                      setSelectedUnits((prev) =>
                        prev.map((id, i) => (i === index ? u.id : id)),
                      )
                    }
                  >
                    {u.name} ({u.symbol})
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4">
        <FooterNote theme={theme} />
      </div>
    </div>
  );
}

export default MoleConverter;
