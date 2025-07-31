import React from "react";
import { useTheme } from "../context/ThemeContext"; 

export default function Footer() {
  const theme = useTheme();

  return (
    <footer
      className="shadow w-full py-2 mt-4 text-center text-sm"
      style={{
        backgroundColor: theme?.surface || "white",
        color: theme?.text || "#4B5563",
        fontFamily: theme?.font_family_main || "'Poppins', sans-serif",
      }}
    >
      &copy; {new Date().getFullYear()} Curious Cockatoo. All rights reserved.
    </footer>
  );
}
