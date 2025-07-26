import React from "react";

export default function ContactSection({ formData, onChange, onSubmit, status, theme }) {
  return (
    <section className="mt-12 sm:mt-16 mb-8">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8" style={{ color: theme?.primary }}>
        Contact Us
      </h2>
      <div
        className="shadow rounded-lg overflow-hidden flex flex-col lg:flex-row"
        style={{ backgroundColor: theme?.surface }}
      >
        <div className="w-full lg:w-1/2 bg-gradient-to-br from-blue-500 to-blue-700 p-6 sm:p-8 text-white flex flex-col justify-center items-center text-center">
          <img
            src="/contact-image.svg"
            alt="Contact illustration"
            className="w-full max-w-[160px] sm:max-w-[200px] mb-4"
          />
          <h3 className="text-xl sm:text-2xl font-bold mb-2">Let’s Talk!</h3>
          <p className="text-sm opacity-90 max-w-sm">
            Have questions, suggestions, or just want to say hi? Fill out the form and we’ll get back to you soon.
          </p>
        </div>

        <div className="w-full lg:w-1/2 p-6 sm:p-8">
          <form onSubmit={onSubmit} className="space-y-4">
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
              className="text-white px-6 py-2 rounded w-full"
              style={{ backgroundColor: theme?.primary }}
            >
              Send Message
            </button>
            {status && <p className="text-sm text-center text-gray-600 mt-2">{status}</p>}
          </form>
        </div>
      </div>
    </section>
  );
}
