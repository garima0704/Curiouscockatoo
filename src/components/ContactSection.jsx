import React from "react";
import { useTranslation } from "react-i18next";

export default function ContactSection({ formData, onChange, onSubmit, status, theme }) {
  const { t } = useTranslation();

  return (
    <section className="mt-12 sm:mt-16 mb-8">
      <h2
        className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8"
        style={{ color: theme?.primary }}
      >
        {t("sections.contact_us")}
      </h2>

      {/* Match the width of the converter box */}
      <div className="max-w-screen-md mx-auto px-4">
        <div
          className="rounded-lg shadow p-6 sm:p-8"
          style={{ backgroundColor: theme?.surface }}
        >
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              name="name"
              placeholder={t("contact_form.name")}
              className="w-full border border-gray-300 rounded px-4 py-2"
              style={{ backgroundColor: theme?.base }}
              value={formData.name}
              onChange={onChange}
              required
              aria-label={t("contact_form.name")}
            />
            <input
              type="email"
              name="email"
              placeholder={t("contact_form.email")}
              className="w-full border border-gray-300 rounded px-4 py-2"
              style={{ backgroundColor: theme?.base }}
              value={formData.email}
              onChange={onChange}
              required
              aria-label={t("contact_form.email")}
            />
            <textarea
              name="message"
              placeholder={t("contact_form.message")}
              className="w-full border border-gray-300 rounded px-4 py-2"
              rows="5"
              style={{ backgroundColor: theme?.base }}
              value={formData.message}
              onChange={onChange}
              required
              aria-label={t("contact_form.message")}
            ></textarea>
            <button
              type="submit"
              className="text-white px-4 sm:px-6 py-2 rounded w-full min-h-[44px]"
              style={{ backgroundColor: theme?.primary }}
              aria-label={t("contact_form.send_message")}
            >
              {t("contact_form.send_message")}
            </button>
            {status && (
              <p className="text-sm text-center text-gray-600 mt-2">{status}</p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
