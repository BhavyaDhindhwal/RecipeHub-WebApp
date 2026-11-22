
import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [favouriteCount, setFavouriteCount] = useState(0);

  // FETCH FAVOURITE COUNT
  useEffect(() => {
    let ignore = false;

    const fetchFavouriteCount = async () => {
      const token = localStorage.getItem("recipehub_token");

      if (!user || user.role === "admin" || !token) {
        setFavouriteCount(0);
        return;
      }

      try {
        const data = await apiRequest("/recipes/favourites");

        if (!ignore) {
          setFavouriteCount(
            data.totalFavourites ?? (data.favourites || []).length
          );
        }
      } catch (error) {
        if (!ignore) {
          console.error("Favourite Count Error:", error.message);
        }
      }
    };

    fetchFavouriteCount();

    return () => {
      ignore = true;
    };
  }, [user, location.pathname]);

  // LOGOUT
  const handleLogout = () => {
    logout();
    setFavouriteCount(0);
    navigate("/login");
  };

  return (
    <nav className="navbar">
      {/* LOGO */}
      <Link to="/" className="logo">
        Recipe<span>Hub.</span>
      </Link>

      {/* NAVIGATION LINKS */}
      <div className="nav-links">
        {user?.role === "admin" ? (
          <>
            <Link to="/admin">Admin Dashboard</Link>
            <Link to="/explore">Recipes</Link>
            <Link to="/add-recipe">Add Recipe</Link>
            <Link to="/profile" className="profile-nav-link">👤 Profile</Link>
          </>
        ) : (
          <>
            <Link to="/">Home</Link>
            <Link to="/explore">Explore Recipes</Link>
            {user && (
              <>
                <Link to="/favourites" className="favourites-nav-link">
                  <span>♥</span> Favourites
                  <span className="favourite-count-badge">{favouriteCount}</span>
                </Link>
                <Link to="/meal-planner">Meal Planner</Link>
                <Link to="/add-recipe">Add Recipe</Link>
                <Link to="/profile" className="profile-nav-link">👤 Profile</Link>
              </>
            )}
          </>
        )}
      </div>

      {/* NAVIGATION ACTIONS */}
      <div className="nav-actions">
        {user ? (
          <>
            <span className="welcome-user">
              Hi, {user.name}
            </span>

            <button
              type="button"
              className="nav-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="login-link">
              Login
            </Link>

            <Link to="/register" className="nav-btn">
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
