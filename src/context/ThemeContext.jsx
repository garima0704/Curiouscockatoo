import React, { createContext, useEffect, useState, useContext } from "react";
import pb from "../utils/pocketbaseClient";
import { useTranslation } from "react-i18next";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(null);
  const { i18n } = useTranslation();
  const lang = i18n.language || "en";

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const record = await pb.collection("site_settings").getFirstListItem("");

        // ---------- LANGUAGE-BASED LOGO ----------
        const logo =
          lang === "es"
            ? record.logo_es
              ? pb.files.getURL(record, record.logo_es)
              : null
            : record.logo_en
            ? pb.files.getURL(record, record.logo_en)
            : null;

        // ---------- SINGLE FAVICON ----------
        const favicon = record.favicon
          ? pb.files.getURL(record, record.favicon)
          : null;

        setTheme({
          primary: record.primary_color,
          surface: record.surface_color,
          base: record.base_color,
          box: record.box_color,
          font: record.font_family_main || "'Poppins', sans-serif",
          logo,
          favicon,
          headerBg: record.header_bg_color,
        });

        // ---------- UPDATE FAVICON ----------
        if (favicon) {
          let link = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.head.appendChild(link);
          }
          link.href = favicon;
        }

        // ---------- FONT ----------
        if (record.font_family_main) {
          document.body.style.fontFamily = record.font_family_main;
        }

        // ---------- BASE BACKGROUND ----------
        if (record.base_color) {
          document.body.style.backgroundColor = record.base_color;
        }

      } catch (err) {
        console.error("Failed to load theme settings:", err);
      }
    };

    fetchTheme();
  }, [lang]); // re-run only when language changes (affects logo only)

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
