import { useTranslation } from "react-i18next";

export default function FooterNote({ theme }) {
  const { t } = useTranslation();

  return (
    <div
      role="note"
      className="text-gray-700 text-sm px-4 py-3 rounded w-full"
      style={{ backgroundColor: theme?.surface }}
    >
      <strong>{t("footer.note_label")}:</strong>{" "}
      <span className="whitespace-normal">{t("footer.note_text")}</span>
    </div>
  );
}
