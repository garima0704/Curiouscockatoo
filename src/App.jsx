import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
          <Route path="/" element={<HomePage />} />
          <Route path="/category/:categoryName" element={<CategoryPageWrapper />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
