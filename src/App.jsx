import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home";
import CategoryPageWrapper from "./pages/CategoryPageWrapper";
import { ThemeProvider } from "./context/ThemeContext"; // ✅ Ensure this path is correct

function App() {
  return (
    <ThemeProvider> {/* 🔁 Provides dynamic theme from PocketBase */}
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/category/:categoryName" element={<CategoryPageWrapper />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
