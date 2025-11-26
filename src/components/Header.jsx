import React, { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import pb from "../utils/pocketbaseClient";

export default function Header() {
  const theme = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const changeLanguage = async (newLang) => {
    const oldLang = i18n.language;
    i18n.changeLanguage(newLang);
    localStorage.setItem("lang", newLang);

    const pathParts = location.pathname.split("/").slice(1);

    if (pathParts[0] === "en" || pathParts[0] === "es") {
      pathParts[0] = newLang;
    } else {
      pathParts.unshift(newLang);
    }

    if (pathParts[1] === "category" && pathParts[2]) {
      const currentSlug = decodeURIComponent(pathParts[2]);
      try {
        const category = await pb.collection("categories").getFirstListItem(
          oldLang === "es"
            ? `slug_es="${currentSlug}"`
            : `slug_en="${currentSlug}"`
        );
        const targetSlug = newLang === "es" ? category.slug_es : category.slug_en;
        pathParts[2] = encodeURIComponent(targetSlug);
      } catch (err) {
        console.error("Error switching category slug:", err);
      }
    }

    navigate("/" + pathParts.join("/"), { replace: true });
  };

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-shadow duration-300 ${
        scrolled ? "shadow-md" : ""
      }`}
      style={{
        backgroundColor: theme?.headerBg || theme?.surface || "white",
        color: theme?.text || "#1f2937",
        fontFamily: theme?.font || "inherit",
      }}
    >
      {/* FLEX CONTAINER FOR LOGO + TOGGLES */}
      <div
        className="
          max-w-7xl 
          mx-auto 
          px-4 
          sm:px-6 
          py-3
          flex 
          flex-col 
          sm:flex-row 
          sm:items-center 
          sm:justify-between
        "
      >
        {/* LOGO */}
        <div className="flex justify-center sm:justify-start">
          <Link to={`/${i18n.language}`} aria-label="Go to homepage">
            {theme?.logo ? (
              <img
                src={theme.logo}
                alt="Logo"
                className="
                  h-14 
                  sm:h-16 
                  md:h-20 
                  object-contain 
                  transition-all
                "
              />
            ) : (
              <h1
                className="text-xl sm:text-2xl font-bold"
                style={{ color: theme?.primary || "#1D4ED8" }}
              >
                Curious Cockatoo
              </h1>
            )}
          </Link>
        </div>

        {/* LANGUAGE TOGGLES */}
        <div className="flex justify-end gap-2 sm:gap-3 text-sm sm:text-base mt-2 sm:mt-0">
          <button
            onClick={() => changeLanguage("en")}
            className={`px-2 py-1 sm:px-3 rounded ${
              i18n.language === "en"
                ? "font-semibold text-blue-600 underline"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            EN
          </button>

          <span className="text-gray-400">|</span>

          <button
            onClick={() => changeLanguage("es")}
            className={`px-2 py-1 sm:px-3 rounded ${
              i18n.language === "es"
                ? "font-semibold text-blue-600 underline"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            ES
          </button>
        </div>
      </div>
    </header>
  );
}
