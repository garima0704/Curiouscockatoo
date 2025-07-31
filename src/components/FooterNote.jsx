import React from "react";

export default function FooterNote({ theme }) {
  return (
    <div
	  role="note"
      className="text-gray-700 text-sm px-4 py-3 mt-8 max-w-4xl mx-auto rounded"
      style={{ backgroundColor: theme?.surface }}
    >
      <strong>Note:</strong> Some comparison figures are based on approximations, mean values, or estimates.
    </div>
  );
}
