
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";

function Favourites() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchFavourites = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/recipes/favourites");

      setRecipes(data.favourites || []);
    } catch (err) {
      setError(err.message || "Unable to load favourite recipes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavourites();
  }, []);

  const removeFavourite = async (recipeId) => {
    try {
      await apiRequest(`/recipes/${recipeId}/favourite`, {
        method: "DELETE",
      });

      setRecipes((previous) =>
        previous.filter((recipe) => recipe._id !== recipeId)
      );
    } catch (err) {
      setError(err.message || "Unable to remove favourite");
    }
  };

  if (loading) {
    return <div className="loading">Loading your favourites...</div>;
  }

  return (
    <main className="favourites-page">
      <div className="favourites-container">
        <div className="favourites-heading">
          <span className="section-tag">YOUR COLLECTION</span>
          <h1>My <span>Favourites</span></h1>
          <p>Your personally saved recipes, all in one place.</p>
        </div>

        {error && <p className="favourites-error">{error}</p>}

        {recipes.length === 0 ? (
          <div className="favourites-empty">
            <div>♡</div>
            <h2>No favourite recipes yet</h2>
            <p>Explore delicious recipes and save the ones you love.</p>
            <Link to="/explore" className="primary-btn">
              Explore Recipes
            </Link>
          </div>
        ) : (
          <>
            <div className="favourites-count">
              {recipes.length} saved {recipes.length === 1 ? "recipe" : "recipes"}
            </div>

            <div className="recipe-grid">
              {recipes.map((recipe) => (
                <article className="recipe-card" key={recipe._id}>
                  <div className="recipe-image">
                    <img
                      src={
                        recipe.imageUrl ||
                        "https://placehold.co/600x400?text=RecipeHub"
                      }
                      alt={recipe.title}
                    />

                    <span className="category-badge">
                      {recipe.category}
                    </span>
                  </div>

                  <div className="recipe-card-content">
                    <div className="recipe-meta">
                      <span>⏱ {recipe.cookingTime || 0} mins</span>
                      <span>
                        ⭐ {Number(recipe.averageRating || 0).toFixed(1)}
                      </span>
                    </div>

                    <h3>{recipe.title}</h3>
                    <p>{recipe.description}</p>

                    <div className="recipe-card-footer">
                      <Link to={`/recipes/${recipe._id}`}>
                        View Recipe →
                      </Link>

                      <button
                        type="button"
                        className="remove-favourite-btn"
                        onClick={() => removeFavourite(recipe._id)}
                        aria-label={`Remove ${recipe.title} from favourites`}
                      >
                        ♥ Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default Favourites;
