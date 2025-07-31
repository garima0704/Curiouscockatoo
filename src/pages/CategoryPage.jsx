import React, { useEffect, useState } from "react";
import pb from "../utils/pocketbaseClient";
import AuxiliaryConverter from "../components/AuxiliaryConverter";
import Converter from "../components/Converter";
import FunFacts from "../components/FunFacts";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useTheme } from "../context/ThemeContext";

function CategoryPage({ categoryName }) {
  const theme = useTheme();
  const [categoryId, setCategoryId] = useState(null);
  const [auxiliaryCategories, setAuxiliaryCategories] = useState([]);
  const [error, setError] = useState(null);
  const [topNote, setTopNote] = useState("");
  const [prefixes, setPrefixes] = useState([]);
  const [category, setCategory] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const normalizedSlug = categoryName.toLowerCase();
        const mainCategory = await pb
          .collection("categories")
          .getFirstListItem(`slug="${normalizedSlug}"`, {
            expand: "auxiliary",
          });

        setCategory(mainCategory);
        setCategoryId(mainCategory.id);

        const rawTopNote = mainCategory.top_note || "";
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(rawTopNote, "text/html");
        const visibleText = htmlDoc.body.textContent?.trim();
        setTopNote(visibleText ? rawTopNote : "");

        const auxiliary = Array.isArray(mainCategory.expand?.auxiliary)
          ? mainCategory.expand.auxiliary
          : mainCategory.expand?.auxiliary
            ? [mainCategory.expand.auxiliary]
            : [];

        setAuxiliaryCategories(auxiliary);
        setError(null);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Category not found or error fetching data.");
      }
    };

    if (categoryName) fetchCategories();
  }, [categoryName]);

  useEffect(() => {
    const fetchPrefixes = async () => {
      try {
        const records = await pb.collection("prefixes").getFullList({
          sort: "+order",
        });
        setPrefixes(records);
      } catch (err) {
        console.error("Error fetching prefixes:", err);
      }
    };

    fetchPrefixes();
  }, []);

  if (error) {
    return (
      <div className="text-center py-10 text-red-600 font-semibold">
        {error}
      </div>
    );
  }

  if (!categoryId)
    return <div className="text-center py-10">Loading category...</div>;

  const total = auxiliaryCategories.length;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: theme?.background,
        color: theme?.text,
        fontFamily: theme?.font,
      }}
    >
      <Header />

      <main className="flex-grow px-6 pt-24 pb-10 max-w-7xl mx-auto space-y-16">
        {/* Category Heading */}
        <section className="px-4 sm:px-6 lg:px-8 pt-10 pb-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-left mb-2" style={{ color: "#1e40af" }}>
            {category?.name}
          </h1>
        </section>

        {/* Auxiliary Section */}
        {total > 0 && (
          <section className="px-4 sm:px-6 lg:px-8 py-6 -mt-6">
            <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: theme?.primary }}>
              Auxiliary Calculation
            </h2>
            <div className="grid gap-8 sm:grid-cols-2">
              {auxiliaryCategories.map((aux, index) => {
                const isLastOdd = total % 2 === 1 && index === total - 1 && total > 1;
                const isOnlyOne = total === 1;

                return (
                  <div
                    key={aux.id}
                    className={`p-6 rounded-lg shadow hover:shadow-lg transition ${
                      isLastOdd || isOnlyOne ? "sm:col-span-2 sm:mx-auto sm:w-1/2" : ""
                    }`}
                    style={{ backgroundColor: theme?.surface }}
                  >
                    <h3 className="text-xl font-semibold mb-4 text-center">
                      {aux.name}
                    </h3>
                    <AuxiliaryConverter categoryId={aux.id} />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Main Converter */}
        <section className="px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: theme?.primary }}>
            Main Calculation
          </h2>
          <div className="p-6 rounded-lg shadow space-y-4" style={{ backgroundColor: theme?.surface }}>
            {topNote && (
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: topNote }}
              />
            )}
            <Converter categoryId={categoryId} />
          </div>
        </section>

        {/* Fun Facts */}
        <section className="px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: theme?.primary }}>
            Fun Facts
          </h2>
          <div className="px-6 py-6 rounded-lg shadow" style={{ backgroundColor: theme?.surface }}>
            <FunFacts categoryId={categoryId} />
          </div>
        </section>

        {/* Prefixes */}
        <section className="px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: theme?.primary }}>
            Prefixes
          </h2>

          <div className="rounded-lg shadow overflow-x-auto max-w-7xl mx-auto" style={{ backgroundColor: theme?.surface }}>
            <table className="min-w-full divide-y divide-gray-200 text-sm table-fixed">
              <thead className="bg-gray-200 text-gray-800">
                <tr>
                  <th className="px-4 py-3 w-[20%] text-center font-semibold">Name</th>
                  <th className="px-4 py-3 w-[15%] text-center font-semibold">Symbol</th>
                  <th className="px-4 py-3 w-[25%] text-center font-semibold">Multiplier</th>
                  <th className="px-4 py-3 w-[15%] text-center font-semibold">10ⁿ</th>
                  <th className="px-4 py-3 w-[25%] text-center font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-center">
                {prefixes.map((prefix) => (
                  <tr key={prefix.id} className="odd:bg-gray-50">
                    <td className="px-4 py-2 break-words">{prefix.name || prefix.prefix}</td>
                    <td className="px-4 py-2 break-words">{prefix.symbol}</td>
                    <td className="px-4 py-2 break-words">{prefix.multiplier}</td>
                    <td className="px-4 py-2 text-base">
                      <span className="flex items-center justify-center">
                        <span>10</span>
                        <sup className="text-[1.5em] ml-0.5 font-normal leading-none relative -top-0.5">
                          {prefix.exponential.replace("10", "")}
                        </sup>
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-pre-line break-words">{prefix.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <div className="text-sm px-4 py-3 mt-12 max-w-4xl mx-auto rounded" style={{ backgroundColor: theme?.surface, color: theme?.text }}>
        <strong>Note:</strong> Some comparison figures are based on approximations, mean values, or estimates. Check important information for accuracy.
      </div>

      <Footer />
    </div>
  );
}

export default CategoryPage;
