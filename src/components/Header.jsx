import React, { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { Link } from "react-router-dom";

export default function Header() {
  const theme = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
  <div className="max-w-7xl mx-auto px-6 flex justify-start items-center">
    <Link to="/">
      {theme?.logo ? (
        <img
          src={theme.logo}
          alt="Logo"
          className="h-11 sm:h-14 md:h-16 object-contain transition-all"
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
