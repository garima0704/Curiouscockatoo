import React, { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Header() {
  const theme = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const { i18n } = useTranslation(); 
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Function to change language and update URL
  const changeLanguage = (newLang) => {
    i18n.changeLanguage(newLang);
    localStorage.setItem("lang", newLang);

    // Replace the current language in the URL with the new language
    const pathParts = location.pathname.split("/").slice(2); // remove old lang
    navigate(`/${newLang}/${pathParts.join("/")}`);
  };

  return (
    <header
      className={`fixed top-0 z-50 w-full py-2 px-0 sm:py-3 transition-shadow duration-300 ${
        scrolled ? "shadow-md" : ""
      }`}
      style={{
        backgroundColor: theme?.headerBg || theme?.surface || "white",
        color: theme?.text || "#1f2937",
        fontFamily: theme?.font || "inherit",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Left: Logo */}
        <Link to={`/${i18n.language}`} aria-label="Go to homepage">
          {theme?.logo ? (
            <img
              src={theme.logo}
              alt="Logo"
              className="h-12 sm:h-14 md:h-16 object-contain transition-all"
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

        {/* Right: Language Switcher */}
        <div className="flex items-center gap-2 text-sm sm:text-base">
          <button
            onClick={() => changeLanguage("en")}
            className={`px-2 py-1 rounded ${
              i18n.language === "en"
                ? "font-semibold text-blue-600 underline"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            ENGLISH
          </button>
          <span className="text-gray-400">|</span>
          <button
            onClick={() => changeLanguage("es")}
            className={`px-2 py-1 rounded ${
              i18n.language === "es"
                ? "font-semibold text-blue-600 underline"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            SPANISH
          </button>
        </div>
      </div>
    </header>
  );
}
