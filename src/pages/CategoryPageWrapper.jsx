import React from "react";
import { useParams, Navigate } from "react-router-dom";
import CategoryPage from "./CategoryPage";

// Allowed languages
const SUPPORTED_LANGS = ["en", "es"];

function CategoryPageWrapper() {
  const { lang, categorySlug } = useParams();

  // Redirect to default language if lang is not supported
  if (!SUPPORTED_LANGS.includes(lang)) {
    return <Navigate to="/en" replace />;
  }

  if (!categorySlug) {
    return <div className="text-center py-10">Category not found</div>;
  }

  return (
    <CategoryPage
      lang={lang}
      categorySlug={decodeURIComponent(categorySlug)}
    />
  );
}

export default CategoryPageWrapper;
