import React, { useEffect, useState } from "react";
import pb from "../utils/pocketbaseClient";
import RealWorldBox from "./RealWorldBox";
import {formatNumber,formatNumberString,} from "../utils/formatNumber";
import { useTheme } from "../context/ThemeContext";
import { parseScientific } from "../utils/parseScientific";
import MolConverter from "./MolConverter";
import TemperatureConverter from "./TemperatureConverter";
import RefractiveIndexConverter from "./RefractiveIndexConverter";
import AngleConverter from "./AngleConverter";
import SoundLevelConverter from "./SoundLevelConverter";
import { distributeBlankCards } from "../utils/blankCardDistributor";
import FooterNote from "./FooterNote";
import { useTranslation } from "react-i18next";

function Converter({ categoryId, lang }) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const activeLang = lang || i18n.language || "en";
  const primaryColor = theme?.primary || "#2b66e6";

  const getPower = (item) =>
    item.type === "blank" ? item.power : item.exponent;

  const [units, setUnits] = useState([]);
  const [inputValue, setInputValue] = useState("");
  
  const [fromUnit, setFromUnit] = useState("");
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [realWorldItems, setRealWorldItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([null, null, null]);
  const [comparisonToggles, setComparisonToggles] = useState([
    false,
    false,
    false,
  ]);
  const [conversionToggles, setConversionToggles] = useState([
    false,
    false,
    false,
  ]);
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [inputScientific, setInputScientific] = useState(false);


  /** -------------------------------------------------
   *  FETCH UNITS + CATEGORY
   * ------------------------------------------------- */
  useEffect(() => {
    if (!categoryId) return;

    const load = async () => {
      try {
        const [unitList, category] = await Promise.all([
          pb
            .collection("units")
            .getFullList({ filter: `category = "${categoryId}"` }),
          pb.collection("categories").getOne(categoryId),
        ]);

        /** CATEGORY LOCALIZATION */
        const mappedCategory = {
          ...category,
          name:
            activeLang === "es"
              ? category.name_es || category.name_en || ""
              : category.name_en || category.name_es || "",
          top_notes:
            activeLang === "es"
              ? category.top_note_es || category.top_note_en || ""
              : category.top_note_en || category.top_note_es || "",
          fun_facts:
            activeLang === "es"
              ? category.fun_facts_es || category.fun_facts_en || ""
              : category.fun_facts_en || category.fun_facts_es || "",
          slug:
            activeLang === "es"
              ? category.slug_es || category.slug_en || ""
              : category.slug_en || category.slug_es || "",
        };
        setCategoryInfo(mappedCategory);

        /** UNIT LOCALIZATION */
        const mappedUnits = unitList
          .map((u) => {
            const localizedName =
              activeLang === "es"
                ? u.name_es || u.name_en || ""
                : u.name_en || u.name_es || "";

            const { name, ...rest } = u;

            return {
              ...rest,
              name: localizedName,
            };
          })
          .sort((a, b) => {
            const af = parseFloat(a.to_base_factor || 0);
            const bf = parseFloat(b.to_base_factor || 0);
            return af - bf;
          });

        setUnits(mappedUnits);

        /** DEFAULT FROM UNIT */
        const baseUnitId = mappedCategory.base_unit;
        const baseExists = mappedUnits.find((u) => u.id === baseUnitId);
        const defaultFrom = mappedUnits[0]?.id || "";
        setFromUnit(defaultFrom);

        /** RESET 3 TARGET UNITS */
        const defaults = mappedUnits
          .filter((u) => u.id !== defaultFrom)
          .slice(0, 3)
          .map((u) => u.id);

        setSelectedUnits(defaults);
      } catch (e) {
        console.error("Unit fetch error:", e);
      }
    };

    load();
  }, [categoryId, activeLang]);
  
 const formatInputDisplay = () => {
  if (!inputValue) return "";

  const num = Number(inputValue);
  if (isNaN(num)) return "";

  if (!inputScientific) return inputValue;

  // ✅ STRING ONLY formatter
  return formatNumberString(num, true);
};




  /** -------------------------------------------------
   *  FETCH REAL WORLD ITEMS
   * ------------------------------------------------- */
  useEffect(() => {
    if (!categoryId) return;

    const loadReal = async () => {
      try {
        const list = await pb.collection("realworld_items").getFullList({
          filter: `category = "${categoryId}"`,
          expand: "unit",
        });

        /** LOCALIZATION of items */
        const localized = list.map((item) => ({
          ...item,
          name:
            activeLang === "es"
              ? item.name_es || item.name_en || ""
              : item.name_en || item.name_es || "",
          notes:
            activeLang === "es"
              ? item.notes_es || item.notes_en || ""
              : item.notes_en || item.notes_es || "",
          expression:
            activeLang === "es"
              ? item.expression_es || item.expression_en || ""
              : item.expression_en || item.expression_es || "",
        }));

        /** NUMERIC + EXPONENT detection */
        const withExp = localized.map((item) => {
          let num = NaN;

          if (item.scientific_value) num = parseFloat(item.scientific_value);
          if ((!num || isNaN(num)) && item.approx_value)
            num = parseFloat(item.approx_value);
          if ((!num || isNaN(num)) && item.expression) {
            const parsed = parseScientific(item.expression);
            if (!isNaN(parsed)) num = parsed;
          }

          const exponent =
            num && !isNaN(num) && num !== 0
              ? Math.floor(Math.log10(Math.abs(num)))
              : null;

          return { ...item, _num: num, exponent };
        });

        const valid = (item) =>
          item._num && !isNaN(item._num) && item._num !== 0;

        const forceZero = withExp.filter(
          (x) => x.force_last_position && !valid(x),
        );
        const normal = withExp.filter(
          (x) => !(x.force_last_position && !valid(x)),
        );
        const safe = normal.filter((x) => x.exponent !== null);

        /** INSERT blank cards between exponent jumps */
        const enriched = distributeBlankCards(safe, 9);

        const finalItems = [...enriched, ...forceZero].sort(
          (a, b) => getPower(a) - getPower(b),
        );

        setRealWorldItems(finalItems);

        const firstThree = finalItems
          .filter((x) => x.type !== "blank")
          .slice(0, 3);
        setSelectedItems([
          firstThree[0] || null,
          firstThree[1] || null,
          firstThree[2] || null,
        ]);
      } catch (e) {
        console.error("Real world fetch error:", e);
      }
    };

    loadReal();
  }, [categoryId, activeLang]);

  /** RESET conversion options if fromUnit changes */
  useEffect(() => {
    if (units.length && fromUnit) {
      const defaults = units
        .filter((u) => u.id !== fromUnit)
        .slice(0, 3)
        .map((u) => u.id);

      setSelectedUnits(defaults);
    }
  }, [fromUnit, units]);

  /** Specialized converter routing */
  const catSlug = categoryInfo?.slug_en?.toLowerCase() || "";
  if (catSlug === "mol") return <MolConverter categoryId={categoryId} />;
  if (catSlug === "temperature")
    return <TemperatureConverter categoryId={categoryId} />;
  if (catSlug === "refractive-index")
    return <RefractiveIndexConverter categoryId={categoryId} />;
  if (catSlug === "angle") return <AngleConverter categoryId={categoryId} />;
  if (catSlug === "sound-level")
    return <SoundLevelConverter categoryId={categoryId} />;

  /** -----------------------
   *   MAIN CONVERSION
   * ----------------------- */
  const convert = (toUnitId) => {
    const from = units.find((u) => u.id === fromUnit);
    const to = units.find((u) => u.id === toUnitId);
    if (!from || !to) return null;
    if (inputValue === "") return null;

    const x = parseFloat(inputValue);
    if (isNaN(x)) return null;

    const parseF = (v) =>
      typeof v === "object" && v?.value ? parseFloat(v.value) : parseFloat(v);

    const fromF = parseF(from.to_base_factor);
    const toF = parseF(to.to_base_factor);

    if (isNaN(fromF) || isNaN(toF) || toF === 0) return null;
    return (x * fromF) / toF;
  };

  const compare = (item) => {
    if (!item) return null;
    if (inputValue === "") return null;

    const from = units.find((u) => u.id === fromUnit);
    if (!from) return null;

    const x = parseFloat(inputValue);
    if (isNaN(x)) return null;

    const parseF = (v) =>
      typeof v === "object" && v?.value ? parseFloat(v.value) : parseFloat(v);

    const base = x * parseF(from.to_base_factor);

    let raw = NaN;
    if (item.expression) raw = parseScientific(item.expression);
    if ((!raw || isNaN(raw)) && item.approx_value)
      raw = parseFloat(item.approx_value);
    if ((!raw || isNaN(raw)) && item.scientific_value)
      raw = parseFloat(item.scientific_value);

    if (!raw || isNaN(raw)) return null;
    return base / raw;
  };

  /** -----------------------
   *  RENDER
   * ----------------------- */
  return (
    <div className="space-y-10 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT PANEL - INPUT + FROM UNIT */}
        <div className="w-full lg:w-64 flex flex-col items-center justify-center gap-4">
		


          <div className="relative w-full">
		  		<div className="flex justify-center gap-2 mb-2">
  <button
    className={`px-3 py-1 rounded-l ${
      !inputScientific ? "text-white" : "bg-white border text-black"
    }`}
    style={{
      borderColor: "#ccc",
      backgroundColor: !inputScientific ? primaryColor : "white",
    }}
    onClick={() => setInputScientific(false)}
  >
    {t("terms.general")}
  </button>

  <button
    className={`px-3 py-1 rounded-r ${
      inputScientific ? "text-white" : "bg-white border text-black"
    }`}
    style={{
      borderColor: "#ccc",
      backgroundColor: inputScientific ? primaryColor : "white",
    }}
    onClick={() => setInputScientific(true)}
  >
    {t("terms.scientific")}
  </button>
</div>
            <input
  type="text"
  value={inputScientific ? formatInputDisplay() : inputValue}
  readOnly={inputScientific}
  onChange={(e) => {
    if (inputScientific) return;

    const raw = e.target.value.match(/^\d*\.?\d*/)?.[0] || "";
    if (raw === "" || (!isNaN(raw) && parseFloat(raw) >= 0)) {
      setInputValue(raw);
    }
  }}
  placeholder={t("terms.enter_value")}
  className={`border p-2 rounded w-full font-mono ${
  inputScientific ? "bg-white cursor-default" : ""
}`}

/>



          </div>

          <div className="border rounded max-h-40 overflow-y-auto w-full text-sm space-y-1 bg-white">
            {units.map((u) => {
              const displayName =
                activeLang === "es"
                  ? u.name_es?.trim()
                    ? `${u.name_es} (${u.symbol})`
                    : u.symbol
                  : `${u.name_en || u.name_es} (${u.symbol})`;

              return (
                <div
                  key={u.id}
                  onClick={() => setFromUnit(u.id)}
                  className={`cursor-pointer p-1 rounded hover:bg-blue-100 ${
                    fromUnit === u.id ? "bg-blue-200 font-medium" : ""
                  }`}
                >
                  {displayName}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT SIDE CONTENT */}
        <div className="flex-1 space-y-10">
          {/* Conversion */}
          {units.length > 1 && selectedUnits.length > 0 && (
            <div className="mx-auto" style={{ maxWidth: "52rem" }}>
              <div className="text-center text-xl font-bold text-gray-700 mb-2">
                {t("terms.conversion")}
              </div>

              <div
                className={`grid gap-6 justify-items-center
                  ${selectedUnits.length === 1 ? "grid-cols-1" : ""}
                  ${selectedUnits.length === 2 ? "grid-cols-1 sm:grid-cols-2" : ""}
                  ${selectedUnits.length >= 3 ? "md:grid-cols-3" : ""}
                `}
              >
                {selectedUnits.map((toUnitId, index) => {
                  const currentUnit = units.find((u) => u.id === toUnitId);

                  return (
                    <div
                      key={index}
                      className="w-full max-w-sm p-4 rounded shadow flex flex-col gap-3"
                      style={{ backgroundColor: theme?.box }}
                    >
                      {/* General / Scientific toggle */}
                      <div className="flex justify-center gap-2">
                        <button
                          className={`px-3 py-1 rounded-l ${
                            !conversionToggles[index]
                              ? "text-white"
                              : "bg-white border text-black"
                          }`}
                          style={{
                            borderColor: "#ccc",
                            backgroundColor: !conversionToggles[index]
                              ? primaryColor
                              : "white",
                          }}
                          onClick={() =>
                            setConversionToggles((prev) =>
                              prev.map((t, i) => (i === index ? false : t)),
                            )
                          }
                        >
                          {t("terms.general")}
                        </button>

                        <button
                          className={`px-3 py-1 rounded-r ${
                            conversionToggles[index]
                              ? "text-white"
                              : "bg-white border text-black"
                          }`}
                          style={{
                            borderColor: "#ccc",
                            backgroundColor: conversionToggles[index]
                              ? primaryColor
                              : "white",
                          }}
                          onClick={() =>
                            setConversionToggles((prev) =>
                              prev.map((t, i) => (i === index ? true : t)),
                            )
                          }
                        >
                          {t("terms.scientific")}
                        </button>
                      </div>

                      {/* Conversion Result */}
                      <div className="overflow-x-auto max-w-full">
                        <div className="bg-gray-100 p-3 rounded text-center text-blue-700 font-bold text-sm sm:text-base min-h-[48px] flex items-center justify-center">
                          <div className="break-super break-words whitespace-normal">
                            {inputValue && convert(toUnitId) !== null ? (
                              <>
                                {formatNumber(
                                  convert(toUnitId),
                                  conversionToggles[index],
                                )}{" "}
                              </>
                            ) : null}
                            {currentUnit?.symbol}
                          </div>
                        </div>
                      </div>

                      {/* SELECT TARGET UNIT */}
                      <div className="border rounded max-h-36 overflow-y-auto text-sm bg-white">
                        {units
                          .filter((u) => u.id !== fromUnit)
                          .map((u) => (
                            <div
                              key={u.id}
                              onClick={() =>
                                setSelectedUnits((prev) =>
                                  prev.map((id, i) =>
                                    i === index ? u.id : id,
                                  ),
                                )
                              }
                              className={`cursor-pointer p-1 hover:bg-blue-100 ${
                                toUnitId === u.id
                                  ? "bg-blue-200 font-medium"
                                  : ""
                              }`}
                            >
                              {u.name} ({u.symbol})
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comparison */}
          {realWorldItems.length > 0 && (
            <div>
              <div className="text-center text-xl font-bold text-gray-700 mb-2">
                {t("terms.comparison")}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {selectedItems.map((item, index) => (
                  <div
                    key={index}
                    className="w-full p-4 rounded shadow flex flex-col gap-3"
                    style={{ backgroundColor: theme?.box }}
                  >
                    {/* Toggles */}
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
                        {t("terms.general")}
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
                        {t("terms.scientific")}
                      </button>
                    </div>

                    {/* Comparison result */}
                    <div className="overflow-x-auto max-w-full">
                      <div className="bg-gray-100 p-3 rounded text-center text-blue-700 font-bold text-sm sm:text-base min-h-[48px] flex items-center justify-center">
                        <div className="break-super break-words whitespace-normal">
                          {item && inputValue
                            ? formatNumber(
                                compare(item),
                                comparisonToggles[index],
                              )
                            : ""}
                        </div>
                      </div>
                    </div>

                    {/* Real world items list */}
                    <div className="h-[300px] overflow-y-auto pr-1">
                      <RealWorldBox
                        selected={item}
                        setSelected={(v) =>
                          setSelectedItems((prev) =>
                            prev.map((x, i) => (i === index ? v : x)),
                          )
                        }
                        items={realWorldItems}
                        scientificToggle={true}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <FooterNote theme={theme} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Converter;
