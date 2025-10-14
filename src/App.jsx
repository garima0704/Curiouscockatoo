import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/Home";
import CategoryPageWrapper from "./pages/CategoryPageWrapper";
import { ThemeProvider } from "./context/ThemeContext";
import AnalyticsTracker from "./AnalyticsTracker";

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AnalyticsTracker />  
        <Routes>
          {/* Redirect root "/" to default language */}
          <Route path="/" element={<Navigate to="/en" replace />} />

          {/* Home page per language */}
          <Route path="/:lang" element={<HomePage />} />

          {/* Category pages per language */}
          <Route path="/:lang/category/:categorySlug" element={<CategoryPageWrapper />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
