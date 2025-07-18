import React from "react";
import { useParams } from "react-router-dom";
import CategoryPage from "./CategoryPage";

function CategoryPageWrapper() {
  const { categoryName } = useParams();

  return <CategoryPage categoryName={decodeURIComponent(categoryName)} />;
}

export default CategoryPageWrapper;
