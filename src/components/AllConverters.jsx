import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

// Safely converts a slug to title case, defaults to empty string
const toTitleCase = (slug = "") =>
  slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export default function AllConverters({ allCategories, theme, lang }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Compute localized display names and slugs safely
  const localizedCategories = useMemo(() => {
    return allCategories.map((cat) => {
      const displayName =
        cat[`name_${lang}`] || cat.name || toTitleCase(cat.slug_en || cat.slug_es || "");
      const slugForLang =
        lang === "es" ? cat.slug_es || cat.slug_en || "" : cat.slug_en || cat.slug_es || "";

      return {
        ...cat,
        displayName,
        slugForLang,
      };
    });
  }, [allCategories, lang]);

  return (
    <section className="mt-12 sm:mt-16">
      <h2
        className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8"
        style={{ color: theme?.primary }}
      >
        {t("sections.all_converters")}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 gap-y-4">
        {localizedCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() =>
              navigate(`/${lang}/category/${encodeURIComponent(cat.slugForLang)}`)
            }
            className="min-h-[44px] border border-gray-200 rounded px-3 sm:px-4 py-2 sm:py-3 text-center text-gray-800 text-sm sm:text-base font-medium transition duration-200 hover:bg-blue-50 hover:shadow-md cursor-pointer"
            style={{ backgroundColor: theme?.surface }}
            aria-label={`Open ${cat.displayName} converter`}
          >
            {cat.displayName}
          </button>
        ))}
      </div>
    </section>
  );
}
