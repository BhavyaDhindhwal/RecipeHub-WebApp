import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Register from "./pages/Register";
import Explore from "./pages/Explore";
import RecipeDetails from "./pages/RecipeDetails";
import Favourites from "./pages/Favourites";
import MealPlanner from "./pages/MealPlanner";
import Profile from "./pages/Profile";
import AddRecipe from "./pages/AddRecipe";
import AdminDashboard from "./pages/AdminDashboard";

function ProtectedRoute({ children, allowedRole = "user", allowedRoles }) {
  const { user, loading } = useAuth();
  const roles = allowedRoles || [allowedRole];
  if (loading) return <div className="loading">Loading RecipeHub...</div>;
  if (!user) return <Navigate to={roles.includes("admin") && !roles.includes("user") ? "/admin/login" : "/login"} replace />;
  if (!roles.includes(user.role)) return <Navigate to={user.role === "admin" ? "/admin" : "/"} replace />;
  return children;
}

function AppContent() {
  const { loading } = useAuth();
  if (loading) return <div className="loading">Loading RecipeHub...</div>;
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/recipes/:id" element={<RecipeDetails />} />
        <Route path="/favourites" element={<ProtectedRoute><Favourites /></ProtectedRoute>} />
        <Route path="/meal-planner" element={<ProtectedRoute><MealPlanner /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute allowedRoles={["user", "admin"]}><Profile /></ProtectedRoute>} />
        <Route path="/add-recipe" element={<ProtectedRoute allowedRoles={["user", "admin"]}><AddRecipe /></ProtectedRoute>} />
        <Route path="/recipes/:id/edit" element={<ProtectedRoute allowedRoles={["user", "admin"]}><AddRecipe /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return <BrowserRouter><AuthProvider><AppContent /></AuthProvider></BrowserRouter>;
}
export default App;
