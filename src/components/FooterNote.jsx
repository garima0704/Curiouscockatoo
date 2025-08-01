

export default function FooterNote({ theme }) {
  return (
    <div
      role="note"
      className="text-gray-700 text-sm px-4 py-3 rounded w-full"
      style={{ backgroundColor: theme?.surface }}
    >
      <strong>Note:</strong> <span className="whitespace-normal">Some comparison figures are based on approximations, mean values, or estimates.</span>
    </div>
  );
}
