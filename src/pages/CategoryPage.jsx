import React, { useEffect, useState } from "react";
import pb from "../utils/pocketbaseClient";
import AuxiliaryConverter from "../components/AuxiliaryConverter";
import Converter from "../components/Converter";
import FunFacts from "../components/FunFacts";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";

function CategoryPage({ lang, categorySlug }) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();

  const [categoryId, setCategoryId] = useState(null);
  const [category, setCategory] = useState(null);
  const [auxiliaryCategories, setAuxiliaryCategories] = useState([]);
  const [topNote, setTopNote] = useState("");
  const [prefixes, setPrefixes] = useState([]);
  const [error, setError] = useState(null);

  // Change language based on prop
  useEffect(() => {
    if (lang && i18n.language !== lang) i18n.changeLanguage(lang);
  }, [lang, i18n]);

  // Fetch main category and auxiliaries
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        if (!categorySlug) return;

        const decodedSlug = decodeURIComponent(categorySlug); 
        const mainCategory = await pb.collection("categories").getFirstListItem(
        lang === "es"
        ? `slug_es="${decodedSlug}"` // use decoded slug
        : `slug_en="${decodedSlug}"`,
        { expand: "auxiliary" }
       );

        setCategory(mainCategory);
        setCategoryId(mainCategory.id);

       // Parse top note (language-specific)
        const rawTopNote = mainCategory[`top_note_${lang}`] || mainCategory.top_note || "";
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(rawTopNote, "text/html");
        const visibleText = htmlDoc.body.textContent?.trim();
        setTopNote(visibleText ? rawTopNote : "");

        // Handle auxiliary categories
        const auxiliary = Array.isArray(mainCategory.expand?.auxiliary)
          ? mainCategory.expand.auxiliary
          : mainCategory.expand?.auxiliary
          ? [mainCategory.expand.auxiliary]
          : [];
        setAuxiliaryCategories(auxiliary);

        setError(null);
      } catch (err) {
        console.error("Error fetching category:", err);
        setError(t("messages.category_error") || "Category not found.");
      }
    };

    fetchCategory();
  }, [categorySlug, lang, t]);

  // Fetch prefixes
  useEffect(() => {
    const fetchPrefixes = async () => {
      try {
        const records = await pb.collection("prefixes").getFullList({ sort: "+order" });
        setPrefixes(records);
      } catch (err) {
        console.error("Error fetching prefixes:", err);
      }
    };
    fetchPrefixes();
  }, []);

  if (error)
    return <div className="text-center py-10 text-red-600 font-semibold">{error}</div>;

  if (!categoryId)
    return <div className="text-center py-10">{t("messages.loading")}</div>;

  return (
    <div
      className="min-h-screen flex flex-col overflow-x-hidden"
      style={{ backgroundColor: theme?.background, color: theme?.text, fontFamily: theme?.font }}
    >
      <Header />

      <main className="flex-grow pt-24 pb-10">
        <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Category Heading */}
          <section>
            <h1 className="text-2xl sm:text-3xl font-bold mt-6" style={{ color: "#1e40af" }}>
              {category?.[`name_${lang}`] || category?.name}
            </h1>
          </section>

          {/* Main Converter - always appears */}
          <section>
            <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: theme?.primary }}>
              {t("sections.main_calculation")}
            </h2>
            <div className="p-6 rounded-lg shadow space-y-4" style={{ backgroundColor: theme?.surface }}>
              {topNote && <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: topNote }} />}
              <Converter categoryId={categoryId} />
            </div>
          </section>

          {/* Auxiliary Converters - only if they exist */}
          {auxiliaryCategories.length > 0 && (
            <section className="py-6 -mt-6">
              <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: theme?.primary }}>
                {t("sections.auxiliary_calculation")}
              </h2>
              <div className="grid gap-8 sm:grid-cols-2">
                {auxiliaryCategories.map((aux, index) => {
                  const isLastOdd = auxiliaryCategories.length % 2 === 1 && index === auxiliaryCategories.length - 1;
                  const isOnlyOne = auxiliaryCategories.length === 1;
                  return (
                    <div
                      key={aux.id}
                      className={`p-6 rounded-lg shadow hover:shadow-lg transition ${
                        isLastOdd || isOnlyOne ? "sm:col-span-2 sm:mx-auto sm:w-1/2" : ""
                      }`}
                      style={{ backgroundColor: theme?.surface }}
                    >
                      <h3 className="text-xl font-semibold mb-4 text-center">
                        {aux[`name_${lang}`] || aux.name}
                      </h3>
                      <AuxiliaryConverter categoryId={aux.id} lang={lang} />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Fun Facts */}
          <section>
            <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: theme?.primary }}>
              {t("sections.fun_facts")}
            </h2>
            <div className="px-6 py-6 rounded-lg shadow" style={{ backgroundColor: theme?.surface }}>
              <FunFacts categoryId={categoryId} lang={lang} />
            </div>
          </section>

          {/* Prefixes */}
          <section>
            <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: theme?.primary }}>
              {t("sections.prefixes")}
            </h2>
            <div className="rounded-lg shadow overflow-x-auto w-full" style={{ backgroundColor: theme?.surface }}>
              <div className="min-w-[640px]">
                <table className="w-full divide-y divide-gray-200 text-sm table-auto text-center">
                  <thead className="bg-gray-200 text-gray-800">
                    <tr>
                      <th className="px-4 py-3 font-semibold">{t("prefix.name")}</th>
                      <th className="px-4 py-3 font-semibold">{t("prefix.symbol")}</th>
                      <th className="px-4 py-3 font-semibold">{t("prefix.multiplier")}</th>
                      <th className="px-4 py-3 font-semibold">10ⁿ</th>
                      <th className="px-4 py-3 font-semibold">{t("prefix.description")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {prefixes.map((prefix) => (
                      <tr key={prefix.id} className="odd:bg-gray-50">
                        <td className="px-4 py-2 break-words">
                            {lang === "es"
                            ? prefix.name_es || prefix.name_en   
                            : prefix.name_en                     
                            }
                        </td>
                        <td className="px-4 py-2 break-words">{prefix.symbol}</td>
                        <td className="px-4 py-2 break-words">{prefix.multiplier}</td>
                        <td className="px-4 py-2">
                          <span className="flex items-center justify-center">
                            <span>10</span>
                            <sup className="text-2xl ml-0.5 font-normal leading-none relative -top-0.5">
                              {prefix.exponential.replace("10", "")}
                            </sup>
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-pre-line break-words">
                          {lang === "es" ? prefix.description_es || prefix.description : prefix.description_en || prefix.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default CategoryPage;
