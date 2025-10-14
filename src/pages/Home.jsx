import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import pb from "../utils/pocketbaseClient";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AuxiliaryConverter from "../components/AuxiliaryConverter";
import AllConverters from "../components/AllConverters";
import ContactSection from "../components/ContactSection";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";

export default function Home() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const { lang } = useParams();
  const navigate = useNavigate();

  // State
  const [mainCategories, setMainCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [activeMainCategory, setActiveMainCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitStatus, setSubmitStatus] = useState("");

  // Update i18n language
  useEffect(() => {
    if (lang && i18n.language !== lang) i18n.changeLanguage(lang);
  }, [lang, i18n]);

  // Fetch main categories (is_main = true) and all categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Main categories
        const main = await pb.collection("categories").getFullList({
          filter: "is_main = true",
          sort: `name_${lang}`,
        });
        setMainCategories(main);

        // All categories
        const all = await pb.collection("categories").getFullList({
          sort: `name_${lang}`,
        });
        setAllCategories(all);

        // Set first main category as active
        if (main.length > 0 && !activeMainCategory) {
          setActiveMainCategory({
            id: main[0].id,
            slug_en: main[0].slug_en,
            slug_es: main[0].slug_es,
          });
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();
  }, [lang]);

  // Map slugs to labels for tabs
  const mainCategoryLabels = useMemo(() => {
    const labels = {};
    mainCategories.forEach((cat) => {
      const slug = lang === "es" ? cat.slug_es : cat.slug_en;
      labels[slug] = cat[`name_${lang}`] || cat.name;
    });
    return labels;
  }, [mainCategories, lang]);

  // Contact form handlers
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await pb.collection("contact_messages").create(formData);
      setSubmitStatus(t("messages.success"));
      setFormData({ name: "", email: "", message: "" });
    } catch (err) {
      console.error("Submission failed:", err);
      setSubmitStatus(t("messages.error"));
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col text-gray-800"
      style={{ backgroundColor: theme?.base, fontFamily: theme?.font }}
    >
      <Header />

      <main className="flex-grow pt-24 sm:pt-28">
        <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          {/* Main Tabs Section */}
          <section>
            <div className="flex flex-wrap justify-center gap-4 mb-4">
              {Object.keys(mainCategoryLabels).map((slug) => (
                <button
                  key={slug}
                  onClick={() => {
                    const cat = mainCategories.find(
                      (c) => (lang === "es" ? c.slug_es : c.slug_en) === slug
                    );
                    setActiveMainCategory({
                      id: cat.id,
                      slug_en: cat.slug_en,
                      slug_es: cat.slug_es,
                    });
                  }}
                  className={`px-4 py-2 rounded ${
                    activeMainCategory &&
                    ((lang === "es" && activeMainCategory.slug_es === slug) ||
                      (lang === "en" && activeMainCategory.slug_en === slug))
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {mainCategoryLabels[slug]}
                </button>
              ))}
            </div>

            <div
              className="w-full max-w-3xl mx-auto p-4 sm:p-6 rounded shadow"
              style={{ backgroundColor: theme?.surface }}
            >
              {activeMainCategory ? (
                <AuxiliaryConverter categoryId={activeMainCategory.id} lang={lang} />
              ) : (
                <p className="text-center text-gray-500">{t("messages.loading")}</p>
              )}
            </div>
          </section>

          {/* All Converters Section */}
          <section>
            <AllConverters allCategories={allCategories} theme={theme} lang={lang} />
          </section>

          {/* Contact Form Section */}
          <section>
            <ContactSection
              formData={formData}
              onChange={handleChange}
              onSubmit={handleSubmit}
              status={submitStatus}
              theme={theme}
            />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
