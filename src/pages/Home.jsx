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
  const { lang } = useParams(); // "en" or "es"
  const navigate = useNavigate();

  const [allCategories, setAllCategories] = useState([]);
  const [activeMainCategory, setActiveMainCategory] = useState("");
  const [categoryId, setCategoryId] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitStatus, setSubmitStatus] = useState("");

  // Fixed main categories for tabs
  const mainCategorySlugs = ["length", "volume", "time", "temperature", "mass", "area"];

  // 1️⃣ Update language when URL changes
  useEffect(() => {
    if (lang && i18n.language !== lang) i18n.changeLanguage(lang);
  }, [lang, i18n]);

  // 2️⃣ Fetch all categories from PocketBase once
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await pb.collection("categories").getFullList({
          sort: `name_${lang}`,
        });
        setAllCategories(categories);

        // Set default active category if not set
        if (!activeMainCategory && mainCategorySlugs.length > 0) {
          setActiveMainCategory(mainCategorySlugs[0]);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();
  }, [lang]);

  // 3️⃣ Compute main category labels quickly using useMemo
  const categoryLabels = useMemo(() => {
    const labels = {};
    mainCategorySlugs.forEach((slug) => {
      const cat = allCategories.find((c) => c.slug === slug);
      if (cat) labels[slug] = cat[`name_${lang}`] || cat.name;
    });
    return labels;
  }, [allCategories, lang]);

  // 4️⃣ Fetch categoryId whenever activeMainCategory changes
  useEffect(() => {
    const fetchCategoryId = async () => {
      if (!activeMainCategory) return;
      try {
        const record = await pb
          .collection("categories")
          .getFirstListItem(`slug="${activeMainCategory}"`);
        setCategoryId(record.id);
      } catch (err) {
        console.error("Error fetching categoryId:", err);
        setCategoryId(null);
      }
    };

    fetchCategoryId();
  }, [activeMainCategory, lang]);

  // 5️⃣ Contact form handlers
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
          {/* Tabs + Auxiliary Converter */}
          <section>
            <div className="flex flex-wrap justify-center gap-4 mb-4">
              {mainCategorySlugs.map((slug) => (
                <button
                  key={slug}
                  onClick={() => setActiveMainCategory(slug)}
                  className={`px-4 py-2 rounded ${
                    activeMainCategory === slug
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {categoryLabels[slug] || slug}
                </button>
              ))}
            </div>

            <div
              className="w-full max-w-3xl mx-auto p-4 sm:p-6 rounded shadow"
              style={{ backgroundColor: theme?.surface }}
            >
              {categoryId ? (
                <AuxiliaryConverter categoryId={categoryId} lang={lang} />
              ) : (
                <p className="text-center text-gray-500">{t("messages.loading")}</p>
              )}
            </div>
          </section>

          {/* All Converters */}
          <section>
            <AllConverters allCategories={allCategories} theme={theme} lang={lang} />
          </section>

          {/* Contact Form */}
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
