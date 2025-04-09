import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Users from "./components/Users";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Help from "./components/Help";
import { AuthProvider, useAuth } from "./context/AuthContext";
import TeamActivity from "./components/TeamActivity";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  return isAuthenticated && user?.isAdmin ? (
    children
  ) : (
    <Navigate to="/" />
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App d-flex flex-column min-vh-100">
          <Navbar />
          <div className="container mt-4 flex-grow-1">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/users"
                element={
                  <AdminRoute>
                    <Users />
                  </AdminRoute>
                }
              />
              <Route
                path="/team-activity"
                element={
                  <PrivateRoute>
                    <TeamActivity />
                  </PrivateRoute>
                }
              />
              <Route
                path="/help"
                element={
                  <PrivateRoute>
                    <Help />
                  </PrivateRoute>
                }
              />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
