import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import FoodList from "./components/FoodList";
import Home from "./components/Home";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/foodlist" element={<FoodList />} />
      </Routes>
    </Router>
  );
};

export default App;
