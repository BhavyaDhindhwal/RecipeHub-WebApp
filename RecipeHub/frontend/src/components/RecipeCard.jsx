
import { Link } from "react-router-dom";

function RecipeCard({ recipe }) {
  const fallbackImage =
    "https://placehold.co/600x400?text=Recipe";

  return (
    <article className="recipe-card">
      <Link to={`/recipes/${recipe._id}`}>
        <div className="recipe-image">
          <img
            src={recipe.imageUrl || fallbackImage}
            alt={recipe.title || "Recipe"}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = fallbackImage;
            }}
          />

          <span className="category-badge">
            {recipe.category || "General"}
          </span>
        </div>
      </Link>

      <div className="recipe-card-content">
        <div className="recipe-meta">
          <span>◷ {recipe.cookingTime || 0} min</span>
          <span>♟ {recipe.servings || 1} servings</span>
        </div>

        <Link to={`/recipes/${recipe._id}`}>
          <h3>{recipe.title}</h3>
        </Link>

        <p>{recipe.description || "No description available."}</p>

        <div className="recipe-card-footer">
          <span>
            By {recipe.createdBy?.name || "RecipeHub User"}
          </span>

          <Link to={`/recipes/${recipe._id}`}>
            View Recipe →
          </Link>
        </div>
      </div>
    </article>
  );
}

export default RecipeCard;
