import React, { createContext, useEffect, useState, useContext } from "react";
import pb from "../utils/pocketbaseClient";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const record = await pb.collection("site_settings").getFirstListItem("");

        setTheme({
          primary: record.primary_color,        // e.g. #feb73f
          surface: record.surface_color,        // e.g. #f3f4f6
          base: record.base_color,              // e.g. #ffffff
          box: record.box_color,                // box bg
          font: record.font_family_main || "'Poppins', sans-serif",
          logo: record.logo_url ? pb.files.getURL(record, record.logo_url) : null,
          favicon: record.favicon_url ? pb.files.getURL(record, record.favicon_url) : null,
          headerBg: record.header_bg_color,     // ✅ New field added
        });

        // Favicon setup
        if (record.favicon_url) {
          const link = document.querySelector("link[rel~='icon']");
          if (link) {
            link.href = pb.files.getURL(record, record.favicon_url);
          } else {
            const newLink = document.createElement("link");
            newLink.rel = "icon";
            newLink.href = pb.files.getURL(record, record.favicon_url);
            document.head.appendChild(newLink);
          }
        }

        // Font setup
        if (record.font_family_main) {
          document.body.style.fontFamily = record.font_family_main;
        }

        // Background color
        if (record.base_color) {
          document.body.style.backgroundColor = record.base_color;
        }

      } catch (err) {
        console.error("Failed to load theme settings:", err);
      }
    };

    fetchTheme();
  }, []);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
