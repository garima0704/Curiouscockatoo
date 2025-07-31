import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import pb from "../utils/pocketbaseClient";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AuxiliaryConverter from "../components/AuxiliaryConverter";
import CategoryTabs from "../components/CategoryTabs";
import AllConverters from "../components/AllConverters";
import ContactSection from "../components/ContactSection";
import FooterNote from "../components/FooterNote";
import { useTheme } from "../context/ThemeContext";

const mainCategories = ["length", "temperature", "area", "volume", "mass", "time"];

export default function Home() {
  const theme = useTheme();
  const [activeMainCategory, setActiveMainCategory] = useState(mainCategories[0]);
  const [categoryId, setCategoryId] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitStatus, setSubmitStatus] = useState("");
  const [allCategories, setAllCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategoryId = async () => {
      try {
        const record = await pb.collection("categories").getFirstListItem(`slug="${activeMainCategory}"`);
        setCategoryId(record.id);
      } catch (err) {
        console.error("Error fetching categoryId:", err);
        setCategoryId(null);
      }
    };
    fetchCategoryId();
  }, [activeMainCategory]);

  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        const res = await pb.collection("categories").getFullList({ sort: "name" });
        setAllCategories(res);
      } catch (err) {
        console.error("Error fetching all categories:", err);
      }
    };
    fetchAllCategories();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await pb.collection("contact_messages").create(formData);
      setSubmitStatus("Message sent successfully!");
      setFormData({ name: "", email: "", message: "" });
    } catch (err) {
      console.error("Submission failed:", err);
      setSubmitStatus("There was an error. Please try again.");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col text-gray-800"
      style={{ backgroundColor: theme?.base, fontFamily: theme?.font }}
    >
      <Header />

      <main className="flex-grow pt-24 sm:pt-28">
        {/* Shared Container */}
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          {/* Tabs + Auxiliary Converter */}
          <section>
            <CategoryTabs
              mainCategories={mainCategories}
              active={activeMainCategory}
              onChange={setActiveMainCategory}
              theme={theme}
            />
            <div
              className="w-full max-w-3xl mx-auto p-4 sm:p-6 rounded shadow"
              style={{ backgroundColor: theme?.surface }}
            >
              {categoryId ? (
                <AuxiliaryConverter categoryId={categoryId} />
              ) : (
                <p className="text-center text-gray-500">Loading converter...</p>
              )}
            </div>
          </section>

          {/* All Converters */}
          <section>
            <AllConverters allCategories={allCategories} theme={theme} />
          </section>

          {/* Contact Form */}
          <section>
            <ContactSection
              formData={formData}
              onChange={handleChange}
              onSubmit={handleSubmit}
              status={submitStatus}
              theme={theme}
            />
          </section>
        </div>
      </main>

      {/* Footer Note */}
      <FooterNote theme={theme} />
      <Footer />
    </div>
  );
}
