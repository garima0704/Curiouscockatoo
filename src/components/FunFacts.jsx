import React, { useEffect, useState } from "react";
import pb from "../utils/pocketbaseClient";

function FunFacts({ categoryId, lang = "en" }) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!categoryId) return;

    pb.collection("categories")
      .getOne(categoryId)
      .then((cat) => {
        console.log("Fetched category:", cat);
        console.log("Category ID:", categoryId);

        // Use language-specific field
        const funFacts = lang === "es" ? cat.fun_facts_es : cat.fun_facts_en;
        setText(funFacts || "");
      })
      .catch((err) => {
        console.error("Error fetching fun facts:", err);
        setText("");
      });
  }, [categoryId, lang]); 

  if (!text) return null;

  return (
    <div className="p-4 sm:p-6">
      <div className="prose prose-sm max-w-none text-gray-800 break-words [&_sup]:text-[0.75rem] [&_sup]:font-semibold [&_sup]:leading-none">
        <div dangerouslySetInnerHTML={{ __html: text }} />
      </div>
    </div>
  );
}

export default FunFacts;
