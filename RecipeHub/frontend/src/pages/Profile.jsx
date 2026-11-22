
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";

function Profile() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    name: "",
    email: "",
    bio: "",
    profileImage: "",
  });

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(location.state?.notice || "");

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        bio: user.bio || "",
        profileImage: user.profileImage || "",
      });
    }
  }, [user]);

  // FETCH USER RECIPES
  useEffect(() => {
    let ignore = false;

    const fetchMyRecipes = async () => {
      try {
        setLoading(true);

        const data = await apiRequest("/recipes/mine");
        const myRecipes = data.recipes || [];

        if (!ignore) {
          setRecipes(myRecipes);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Unable to load your recipes");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    if (user) fetchMyRecipes();

    return () => {
      ignore = true;
    };
  }, [user]);

  // INPUT HANDLER
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // SAVE PROFILE
  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const data = await updateProfile(form);

      setForm({
        name: data.user.name || "",
        email: data.user.email || "",
        bio: data.user.bio || "",
        profileImage: data.user.profileImage || "",
      });

      setMessage("Profile updated successfully!");
    } catch (err) {
      setError(err.message || "Unable to update profile");
    } finally {
      setSaving(false);
    }
  };

  // DELETE RECIPE
  const handleDeleteRecipe = async (recipeId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this recipe?"
    );

    if (!confirmed) return;

    try {
      await apiRequest(`/recipes/${recipeId}`, {
        method: "DELETE",
      });

      setRecipes((previous) =>
        previous.filter((recipe) => recipe._id !== recipeId)
      );

      setMessage("Recipe deleted successfully!");
      setError("");
    } catch (err) {
      setError(err.message || "Unable to delete recipe");
    }
  };

  return (
    <main className="profile-page">
      <div className="profile-container">

        <section className="profile-header">
          <span className="section-tag">
            {user?.role === "admin" ? "ADMINISTRATOR ACCOUNT" : "MY ACCOUNT"}
          </span>
          <h1>My <span>Profile.</span></h1>
          <p>
            {user?.role === "admin"
              ? "Manage your administrator account and the recipes you published."
              : "Manage your personal information and recipes."}
          </p>
        </section>

        {error && (
          <div className="profile-message profile-error">
            {error}
          </div>
        )}

        {message && (
          <div className="profile-message profile-success">
            {message}
          </div>
        )}

        <section className="profile-layout">

          {/* PROFILE FORM */}
          <div className="profile-form-card">

            <div className="profile-avatar">
              {form.profileImage ? (
                <img
                  src={form.profileImage}
                  alt="Profile"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span>
                  {form.name?.charAt(0).toUpperCase() || "U"}
                </span>
              )}
            </div>

            <h2>Personal Information</h2>
            <p className="profile-subtitle">
              Update your RecipeHub account details.
            </p>

            <form onSubmit={handleSubmit}>
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                minLength={2}
                maxLength={50}
                required
              />

              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />

              <label>Profile Image URL</label>
              <input
                type="url"
                name="profileImage"
                value={form.profileImage}
                onChange={handleChange}
                placeholder="https://example.com/photo.jpg"
              />

              <label>About Me</label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder="Tell us something about yourself..."
                maxLength={300}
                rows={4}
              />

              <small className="bio-counter">
                {form.bio.length}/300 characters
              </small>

              <button
                type="submit"
                className="profile-save-btn"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>

          {/* PROFILE SUMMARY */}
          <aside className="profile-summary-card">
            <h2>Account Overview</h2>

            <div className="profile-summary-item">
              <span>👤</span>
              <div>
                <small>Account Name</small>
                <strong>{user?.name}</strong>
              </div>
            </div>

            <div className="profile-summary-item">
              <span>✉️</span>
              <div>
                <small>Email Address</small>
                <strong>{user?.email}</strong>
              </div>
            </div>

            <div className="profile-summary-item">
              <span>🍳</span>
              <div>
                <small>My Recipes</small>
                <strong>{recipes.length} Recipes</strong>
              </div>
            </div>

            <div className="profile-summary-item">
              <span>⭐</span>
              <div>
                <small>Account Role</small>
                <strong>{user?.role || "User"}</strong>
              </div>
            </div>

            {user?.role === "admin" && (
              <Link to="/admin" className="profile-explore-btn">
                Go to Admin Dashboard →
              </Link>
            )}
            <Link to="/explore" className="profile-explore-btn">
              Explore Recipes →
            </Link>
          </aside>
        </section>

        {/* MY RECIPES */}
        <section className="my-recipes-section">
          <div className="my-recipes-heading">
            <div>
              <span className="section-tag">YOUR CREATIONS</span>
              <h2>My Recipes</h2>
              <p>Recipes you submit are published after admin approval.</p>
            </div>

            <Link to="/add-recipe" className="profile-explore-btn">
              + Add Recipe
            </Link>
          </div>

          {loading ? (
            <div className="profile-loading">Loading your recipes...</div>
          ) : recipes.length === 0 ? (
            <div className="profile-empty">
              <span>🍽️</span>
              <h3>No recipes yet</h3>
              <p>You haven't shared any recipes yet.</p>
            </div>
          ) : (
            <div className="profile-recipes-grid">
              {recipes.map((recipe) => (
                <article className="profile-recipe-card" key={recipe._id}>
                  {recipe.imageUrl ? (
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.title}
                    />
                  ) : (
                    <div className="profile-recipe-placeholder">🍲</div>
                  )}

                  <div className="profile-recipe-content">
                    <span>{recipe.category}</span>
                    <span className={`recipe-status-pill status-${recipe.status || "approved"}`}>
                      {recipe.status === "pending"
                        ? "⏳ Pending approval"
                        : recipe.status === "rejected"
                        ? "❌ Rejected"
                        : "✅ Published"}
                    </span>
                    <h3>{recipe.title}</h3>
                    {recipe.status === "rejected" && recipe.rejectionReason && (
                      <p className="recipe-reject-note">
                        Admin note: {recipe.rejectionReason}
                      </p>
                    )}
                    <p>⏱ {recipe.cookingTime} minutes</p>

                    <div className="profile-recipe-actions">
                      <Link to={`/recipes/${recipe._id}`}>
                        View
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/recipes/${recipe._id}/edit`)
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="profile-delete-btn"
                        onClick={() => handleDeleteRecipe(recipe._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}

export default Profile;
