import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Lazy load components
const Login = lazy(() => import("./components/Login"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const Users = lazy(() => import("./components/Users"));
const Help = lazy(() => import("./components/Help"));
const TeamActivity = lazy(() => import("./components/TeamActivity"));

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  return isAuthenticated && user?.isAdmin ? children : <Navigate to="/" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App d-flex flex-column min-vh-100">
          <Navbar />
          <div className="container mt-4 flex-grow-1">
            <Suspense fallback={<div>Loading...</div>}>
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
            </Suspense>
          </div>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
