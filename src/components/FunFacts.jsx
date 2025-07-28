import React, { useEffect, useState } from "react";
import pb from "../utils/pocketbaseClient";

function FunFacts({ categoryId }) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!categoryId) return;

    pb.collection("categories")
      .getOne(categoryId)
      .then((cat) => {
        console.log("Fetched category:", cat);
        console.log("Category ID:", categoryId);
        setText(cat.fun_facts || "");
      })
      .catch((err) => {
        console.error("Error fetching fun facts:", err);
        setText("");
      });
  }, [categoryId]);

  if (!text) return null;

  return (
  <div className="prose prose-sm max-w-none text-gray-800 [&_sup]:text-[0.75rem] [&_sup]:font-semibold [&_sup]:leading-none">
    <div dangerouslySetInnerHTML={{ __html: text }} />
  </div>
);

}

export default FunFacts;
