import React from "react";

export default function ContactSection({ formData, onChange, onSubmit, status, theme }) {
  return (
    <section className="mt-12 sm:mt-16 mb-8">
      <h2
        className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8"
        style={{ color: theme?.primary }}
      >
        Contact Us
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
              placeholder="Name"
              className="w-full border border-gray-300 rounded px-4 py-2"
              style={{ backgroundColor: theme?.base }}
              value={formData.name}
              onChange={onChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="w-full border border-gray-300 rounded px-4 py-2"
              style={{ backgroundColor: theme?.base }}
              value={formData.email}
              onChange={onChange}
              required
            />
            <textarea
              name="message"
              placeholder="Message"
              className="w-full border border-gray-300 rounded px-4 py-2"
              rows="5"
              style={{ backgroundColor: theme?.base }}
              value={formData.message}
              onChange={onChange}
              required
            ></textarea>
            <button
              type="submit"
              className="text-white px-4 sm:px-6 py-2 rounded w-full min-h-[44px]"
              style={{ backgroundColor: theme?.primary }}
			  aria-label="Send your message"
            >
              Send Message
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
