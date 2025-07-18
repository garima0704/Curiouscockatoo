import React from "react";
import { useTheme } from "../context/ThemeContext";
import { Link } from "react-router-dom";

export default function Header() {
  const theme = useTheme();

  return (
    <header
      className="shadow w-full py-2 px-4 sm:py-3"
      style={{
        backgroundColor: theme?.headerBg || theme?.surface || "white",
        color: theme?.text || "#1f2937",
        fontFamily: theme?.font || "inherit",
      }}
    >
      <div className="w-full flex justify-center items-center">
        <Link to="/">
          {theme?.logo ? (
            <img
              src={theme.logo}
              alt="Logo"
              className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full bg-white p-1 object-contain transition-all"
            />
          ) : (
            <h1
              className="text-xl sm:text-2xl font-bold"
              style={{ color: theme?.primary || "#1D4ED8" }}
            >
              Curiouscockatoo
            </h1>
          )}
        </Link>
      </div>
    </header>
  );
}
