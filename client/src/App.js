import React from "react";
import { BrowserRouter as Router, Route, Routes, useNavigate } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Home from "./components/Home";

function App() {
  const [user, setUser] = React.useState(null);

  const handleLogin = (name) => {
    setUser(name); 
  };

  return (
    <Router>
      <Routes>
        {user ? (
          <Route path="/home" element={<Home user={user} />} />
        ) : (
          <>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<Login onLogin={handleLogin} />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
