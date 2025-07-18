import React, { useEffect, useState } from "react";
import pb from "../utils/pocketbaseClient";

function FunFacts({ categoryId }) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!categoryId) return;

    pb.collection("categories")
      .getOne(categoryId)
    .then((cat) => {
      console.log("Fetched category:", cat); // ✅ Add this line
console.log("Category ID:", categoryId);
      setText(cat.fun_facts || "");
    })
    .catch((err) => {
      console.error("Error fetching fun facts:", err); // ✅ Add this too
      setText("");
    });
}, [categoryId]);

  if (!text) return null;

  return (
    <div className="prose prose-sm max-w-none text-gray-800">
      <div dangerouslySetInnerHTML={{ __html: text }} />
    </div>
  );
}

export default FunFacts;
