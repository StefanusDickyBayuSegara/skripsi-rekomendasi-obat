import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Login from "./pages/Login";
import Signup from "./pages/Signup";

import Recommendation from "./pages/Recommendation";
import SearchMedicine from "./pages/SearchMedicine";
import SavedList from "./pages/SavedList";

import LandingPage from "./pages/LandingPage";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/recommendation" element={<Recommendation />} />
        <Route path="/search" element={<SearchMedicine />} />
        <Route path="/saved" element={<SavedList />} />
      </Routes>
    </Router>
  );
}

export default App;