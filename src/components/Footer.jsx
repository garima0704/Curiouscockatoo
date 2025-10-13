import React from "react";
import { useTheme } from "../context/ThemeContext"; 
import { useTranslation } from "react-i18next";

export default function Footer() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <footer
      className="shadow w-full py-2 mt-4 text-center text-sm"
      style={{
        backgroundColor: theme?.surface || "white",
        color: theme?.text || "#4B5563",
        fontFamily: theme?.font || "'Poppins', sans-serif",
      }}
    >
      &copy; {new Date().getFullYear()} Curious Cockatoo. {t("footer.rights")}
    </footer>
  );
}
