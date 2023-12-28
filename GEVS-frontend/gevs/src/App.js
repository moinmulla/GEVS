import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.js";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import CryptoJS from "crypto-js";
import { ToastContainer } from "react-toastify";

const ProtectedRoute = ({ children }) => {
  const secretKey = `${process.env.REACT_APP_KEY}` || "NoValue";

  const cookieValue = decodeURIComponent(document.cookie);
  const matches = cookieValue.match(new RegExp(`token=([^;]+)`));
  const role = cookieValue.match(new RegExp(`role=([^;]+)`));
  let bytes, decryptedText;
  if (role) {
    bytes = CryptoJS.AES.decrypt(role[1], secretKey);
    decryptedText = bytes.toString(CryptoJS.enc.Utf8);
  }

  let roleMatchAdmin = false;
  let roleMatchUser = false;
  if (decryptedText == "admin") roleMatchAdmin = true;
  if (decryptedText == "user") roleMatchUser = true;

  if (roleMatchAdmin) {
    return <AdminDashboard />;
  }
  if (roleMatchUser) {
    return <UserDashboard />;
  }

  return matches ? children : <Login />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route exact path="/register" element={<Register />} />
          <Route
            exact
            path="/"
            element={<ProtectedRoute element={<Login />} />}
          />
          <Route
            exact
            path="/login"
            element={<ProtectedRoute element={<Login />} />}
          />
          <Route
            exact
            path="/AdminDashboard"
            element={<ProtectedRoute element={<AdminDashboard />} />}
          />
          <Route
            exact
            path="/UserDashboard"
            element={<ProtectedRoute element={<UserDashboard />} />}
          />
        </Routes>
      </AuthProvider>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover={false}
        theme="colored"
      />
    </Router>
  );
}

export default App;
