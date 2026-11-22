
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import RecipeCard from "../components/RecipeCard";
import { apiRequest } from "../services/api";

function Explore() {
  const navigate = useNavigate();

  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [favouriteIds, setFavouriteIds] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecipes, setTotalRecipes] = useState(0);

  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [favouritesLoading, setFavouritesLoading] = useState(false);

  const [error, setError] = useState("");
  const [favouriteError, setFavouriteError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // FETCH CATEGORIES
  useEffect(() => {
    let ignore = false;

    const fetchCategories = async () => {
      try {
        setCategoryLoading(true);

        const data = await apiRequest("/recipes/categories");

        if (!ignore) {
          setCategories(data.categories || []);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Category Error:", err.message);
        }
      } finally {
        if (!ignore) {
          setCategoryLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      ignore = true;
    };
  }, []);

  // FETCH RECIPES
  useEffect(() => {
    let ignore = false;

    const fetchRecipes = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          search: search.trim(),
          category,
          page: String(page),
          limit: "9",
        });

        const data = await apiRequest(
          `/recipes?${params.toString()}`
        );

        if (ignore) return;

        setRecipes(data.recipes || []);
        setTotalRecipes(data.totalRecipes || 0);
        setTotalPages(Math.max(1, data.totalPages || 1));
      } catch (err) {
        if (!ignore) {
          console.error("Recipe Fetch Error:", err);

          setError(
            err.message || "Unable to load recipes. Please try again."
          );

          setRecipes([]);
          setTotalRecipes(0);
          setTotalPages(1);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchRecipes();

    return () => {
      ignore = true;
    };
  }, [search, category, page, retryCount]);

  // FETCH USER FAVOURITES
  useEffect(() => {
    let ignore = false;

    const fetchFavourites = async () => {
      const token = localStorage.getItem("recipehub_token");

      if (!token) {
        setFavouriteIds([]);
        return;
      }

      try {
        setFavouritesLoading(true);

        const data = await apiRequest("/recipes/favourites");

        if (!ignore) {
          const ids = (data.favourites || []).map(
            (recipe) => recipe._id
          );

          setFavouriteIds(ids);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Favourites Fetch Error:", err.message);
        }
      } finally {
        if (!ignore) {
          setFavouritesLoading(false);
        }
      }
    };

    fetchFavourites();

    return () => {
      ignore = true;
    };
  }, []);

  // ADD / REMOVE FAVOURITE
  const handleFavourite = async (recipeId) => {
    const token = localStorage.getItem("recipehub_token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (favouritesLoading) return;

    const isFavourite = favouriteIds.includes(recipeId);

    try {
      setFavouriteError("");
      setFavouritesLoading(true);

      if (isFavourite) {
        await apiRequest(`/recipes/${recipeId}/favourite`, {
          method: "DELETE",
        });

        setFavouriteIds((previous) =>
          previous.filter((id) => id !== recipeId)
        );
      } else {
        await apiRequest(`/recipes/${recipeId}/favourite`, {
          method: "POST",
        });

        setFavouriteIds((previous) =>
          previous.includes(recipeId)
            ? previous
            : [...previous, recipeId]
        );
      }
    } catch (err) {
      setFavouriteError(
        err.message || "Unable to update favourite"
      );
    } finally {
      setFavouritesLoading(false);
    }
  };

  // SEARCH HANDLER
  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  // CATEGORY HANDLER
  const handleCategory = (value) => {
    setCategory(value.toLowerCase());
    setPage(1);
  };

  // CLEAR FILTERS
  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setPage(1);
  };

  // RETRY HANDLER
  const handleRetry = () => {
    setRetryCount((count) => count + 1);
  };

  // PREVIOUS PAGE
  const handlePrevious = () => {
    setPage((current) => Math.max(1, current - 1));
  };

  // NEXT PAGE
  const handleNext = () => {
    setPage((current) => Math.min(totalPages, current + 1));
  };

  return (
    <main className="explore-page">

      {/* HERO SECTION */}
      <section className="explore-hero">
        <span className="section-tag">
          FIND YOUR NEXT FAVOURITE
        </span>

        <h1>
          Explore Delicious <span>Recipes.</span>
        </h1>

        <p>
          Discover amazing dishes, explore new flavours
          and find inspiration for your next meal.
        </p>

        <div className="explore-search">
          <span>⌕</span>

          <input
            type="search"
            placeholder="Search recipes, ingredients..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </section>

      {/* RECIPES SECTION */}
      <section className="explore-content">

        <div className="explore-heading">
          <div>
            <span className="section-tag">
              OUR COLLECTION
            </span>

            <h2>Discover Recipes</h2>

            <p>
              {loading
                ? "Loading recipes..."
                : `${totalRecipes} recipes available`}
            </p>
          </div>
        </div>

        {/* CATEGORY FILTERS */}
        <div className="category-filters">
          <button
            className={category === "all" ? "active" : ""}
            onClick={() => handleCategory("all")}
          >
            All Recipes
          </button>

          {!categoryLoading &&
            categories.map((item) => (
              <button
                key={item}
                className={
                  category === item.toLowerCase() ? "active" : ""
                }
                onClick={() => handleCategory(item)}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
        </div>

        {categoryLoading && (
          <p className="explore-loading">
            Loading categories...
          </p>
        )}

        {/* FAVOURITE ERROR */}
        {favouriteError && (
          <div className="favourite-error-message">
            {favouriteError}
          </div>
        )}

        {/* RECIPE ERROR */}
        {error && (
          <div className="error-message">
            <span>{error}</span>

            <button
              onClick={handleRetry}
              style={{
                marginLeft: "12px",
                border: "none",
                background: "transparent",
                color: "inherit",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {loading ? (
          <div className="explore-loading">
            Loading delicious recipes...
          </div>
        ) : error ? (
          <div className="empty-recipes">
            <div>⚠️</div>
            <h3>Something went wrong</h3>
            <p>
              Please check your backend connection and try again.
            </p>
            <button onClick={handleRetry}>
              Try Again
            </button>
          </div>
        ) : recipes.length === 0 ? (
          <div className="empty-recipes">
            <div>🥗</div>
            <h3>No recipes found</h3>
            <p>Try another search or category.</p>
            <button onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* RECIPE GRID */}
            <div className="recipe-grid">
              {recipes.map((recipe) => {
                const isFavourite = favouriteIds.includes(recipe._id);

                return (
                  <div
                    className="explore-recipe-wrapper"
                    key={recipe._id}
                  >
                    <RecipeCard recipe={recipe} />

                    <button
                      type="button"
                      className={`explore-favourite-btn ${
                        isFavourite ? "active" : ""
                      }`}
                      onClick={() => handleFavourite(recipe._id)}
                      disabled={favouritesLoading}
                      title={
                        isFavourite
                          ? "Remove from favourites"
                          : "Add to favourites"
                      }
                      aria-label={
                        isFavourite
                          ? "Remove from favourites"
                          : "Add to favourites"
                      }
                    >
                      {isFavourite ? "♥" : "♡"}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  disabled={page === 1}
                  onClick={handlePrevious}
                >
                  ← Previous
                </button>

                <span>
                  Page {page} of {totalPages}
                </span>

                <button
                  disabled={page >= totalPages}
                  onClick={handleNext}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default Explore;
