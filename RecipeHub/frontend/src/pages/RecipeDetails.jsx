
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";

function RecipeDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [checkedIngredients, setCheckedIngredients] = useState([]);

  // Rating and Review states
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Report states
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [reportError, setReportError] = useState("");

  const isLoggedIn = Boolean(
    localStorage.getItem("recipehub_token")
  );

  // Fetch recipe
  useEffect(() => {
    let isMounted = true;

    const fetchRecipe = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await apiRequest(`/recipes/${id}`);

        if (isMounted) {
          setRecipe(data.recipe);
          setCheckedIngredients([]);
          setReviewSubmitted(false);
          setSelectedRating(0);
          setReviewComment("");
          setReviewMessage("");
          setReviewError("");
          setReportOpen(false);
          setReportMessage("");
          setReportError("");
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Unable to load recipe.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRecipe();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Toggle ingredients
  const toggleIngredient = (index) => {
    setCheckedIngredients((previous) =>
      previous.includes(index)
        ? previous.filter((item) => item !== index)
        : [...previous, index]
    );
  };

  // Submit Rating and Review
  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    setReviewMessage("");
    setReviewError("");

    if (!isLoggedIn) {
      setReviewError("Please login to submit a review.");
      return;
    }

    if (selectedRating < 1 || selectedRating > 5) {
      setReviewError("Please select a star rating.");
      return;
    }

    if (!reviewComment.trim()) {
      setReviewError("Please write your review.");
      return;
    }

    try {
      setReviewLoading(true);

      const data = await apiRequest(`/recipes/${id}/reviews`, {
        method: "POST",
        body: JSON.stringify({
          rating: selectedRating,
          comment: reviewComment.trim(),
        }),
      });

      setRecipe((previous) => ({
        ...previous,
        averageRating: data.averageRating,
        ratingsCount: data.ratingsCount,
        reviews: data.reviews,
      }));

      setReviewMessage(
        data.message || "Review submitted successfully!"
      );

      setReviewSubmitted(true);
      setReviewComment("");
      setSelectedRating(0);
    } catch (err) {
      setReviewError(
        err.message || "Unable to submit review."
      );
    } finally {
      setReviewLoading(false);
    }
  };

  // Submit Recipe Report
  const handleReportSubmit = async (e) => {
    e.preventDefault();

    setReportMessage("");
    setReportError("");

    if (!isLoggedIn) {
      setReportError("Please login to report this recipe.");
      return;
    }

    if (!reportReason) {
      setReportError("Please select a reason.");
      return;
    }

    try {
      setReportLoading(true);

      const data = await apiRequest(`/reports/${id}`, {
        method: "POST",
        body: JSON.stringify({
          reason: reportReason,
          description: reportDescription.trim(),
        }),
      });

      setReportMessage(
        data.message || "Report submitted successfully!"
      );

      setReportReason("");
      setReportDescription("");
      setReportOpen(false);
    } catch (err) {
      setReportError(
        err.message || "Unable to submit report."
      );
    } finally {
      setReportLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <main className="recipe-details-page">
        <div className="loading">Loading recipe...</div>
      </main>
    );
  }

  // Error state
  if (error || !recipe) {
    return (
      <main className="recipe-details-page">
        <div className="empty-recipes">
          <h3>Recipe not found</h3>
          <p>
            {error || "This recipe may have been removed."}
          </p>

          <Link to="/explore" className="back-link">
            ← Back to Explore
          </Link>
        </div>
      </main>
    );
  }

  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : [];

  const steps = Array.isArray(recipe.steps)
    ? recipe.steps
    : [];

  const reviews = Array.isArray(recipe.reviews)
    ? [...recipe.reviews].reverse()
    : [];

  const progress =
    ingredients.length > 0
      ? Math.round(
          (checkedIngredients.length / ingredients.length) * 100
        )
      : 0;

  const fallbackImage =
    "https://placehold.co/1200x700?text=Recipe";

  return (
    <main className="recipe-details-page">
      <div className="details-container">

        <Link to="/explore" className="back-link">
          ← Back to Recipes
        </Link>

        {/* Approval status + owner/admin tools */}
        {recipe.status && recipe.status !== "approved" && (
          <div className={`recipe-status-banner status-${recipe.status}`}>
            {recipe.status === "pending" ? (
              <span>
                ⏳ <strong>Waiting for admin approval.</strong> Only you and
                admins can see this recipe right now.
              </span>
            ) : (
              <span>
                ❌ <strong>Rejected by admin.</strong>{" "}
                {recipe.rejectionReason || "Please edit and resubmit."}
              </span>
            )}
          </div>
        )}

        {user &&
          (user.role === "admin" ||
            String(recipe.createdBy?._id || recipe.createdBy) ===
              String(user.id || user._id)) && (
            <div className="recipe-owner-bar">
              <Link to={`/recipes/${recipe._id}/edit`}>✏️ Edit recipe</Link>
            </div>
          )}

        {/* Recipe Hero */}
        <section className="details-hero">
          <div className="details-image-wrapper">
            <img
              className="details-image"
              src={recipe.imageUrl || fallbackImage}
              alt={recipe.title}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = fallbackImage;
              }}
            />
          </div>

          <div className="details-hero-content">
            <span className="section-tag">
              {recipe.category || "General"}
            </span>

            <h1>{recipe.title}</h1>

            <p className="details-description">
              {recipe.description}
            </p>

            <div className="details-meta">
              <div className="meta-item">
                <span>◷</span>
                <div>
                  <strong>
                    {recipe.cookingTime || 0} min
                  </strong>
                  <small>Cooking Time</small>
                </div>
              </div>

              <div className="meta-item">
                <span>♟</span>
                <div>
                  <strong>{recipe.servings || 1}</strong>
                  <small>Servings</small>
                </div>
              </div>

              <div className="meta-item">
                <span>★</span>
                <div>
                  <strong>
                    {Number(recipe.averageRating || 0).toFixed(1)}
                  </strong>
                  <small>
                    {recipe.ratingsCount || 0} Ratings
                  </small>
                </div>
              </div>
            </div>

            <p className="recipe-author">
              Prepared by{" "}
              <strong>
                {recipe.createdBy?.name || "RecipeHub User"}
              </strong>
            </p>

            {/* Report Recipe Section */}
            <div className="recipe-report-area">
              <button
                type="button"
                className="report-recipe-btn"
                onClick={() => {
                  if (!isLoggedIn) {
                    setReportError(
                      "Please login to report this recipe."
                    );
                    return;
                  }

                  setReportError("");
                  setReportOpen((previous) => !previous);
                }}
              >
                ⚑ Report Recipe
              </button>

              {reportOpen && (
                <form
                  className="report-recipe-form"
                  onSubmit={handleReportSubmit}
                >
                  <h3>Report this Recipe</h3>

                  <label htmlFor="reportReason">
                    Reason
                  </label>

                  <select
                    id="reportReason"
                    value={reportReason}
                    onChange={(e) =>
                      setReportReason(e.target.value)
                    }
                    required
                  >
                    <option value="">
                      Select a reason
                    </option>

                    <option value="Inappropriate Content">
                      Inappropriate Content
                    </option>

                    <option value="Incorrect Information">
                      Incorrect Information
                    </option>

                    <option value="Copyright Violation">
                      Copyright Violation
                    </option>

                    <option value="Spam">Spam</option>

                    <option value="Other">Other</option>
                  </select>

                  <label htmlFor="reportDescription">
                    Description
                  </label>

                  <textarea
                    id="reportDescription"
                    value={reportDescription}
                    onChange={(e) =>
                      setReportDescription(e.target.value)
                    }
                    placeholder="Explain the issue..."
                    maxLength={500}
                    rows={4}
                  />

                  <button
                    type="submit"
                    disabled={reportLoading}
                  >
                    {reportLoading
                      ? "Submitting..."
                      : "Submit Report"}
                  </button>
                </form>
              )}

              {reportMessage && (
                <p className="report-success">
                  {reportMessage}
                </p>
              )}

              {reportError && (
                <p className="report-error">
                  {reportError}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Recipe Content */}
        <section className="details-columns">

          {/* Ingredients */}
          <div className="ingredients-section">
            <div className="details-section-heading">
              <div>
                <span className="section-tag">
                  WHAT YOU NEED
                </span>
                <h2>Ingredients</h2>
              </div>

              <span className="ingredient-count">
                {checkedIngredients.length}/{ingredients.length}
              </span>
            </div>

            <div className="ingredient-progress">
              <div
                className="ingredient-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="progress-text">
              {progress}% ingredients completed
            </p>

            <div className="ingredients-list">
              {ingredients.length > 0 ? (
                ingredients.map((item, index) => (
                  <label
                    className={`ingredient-row ${
                      checkedIngredients.includes(index)
                        ? "ingredient-checked"
                        : ""
                    }`}
                    key={index}
                  >
                    <input
                      type="checkbox"
                      checked={checkedIngredients.includes(index)}
                      onChange={() => toggleIngredient(index)}
                    />

                    <span className="ingredient-name">
                      {item.name}
                    </span>

                    <strong>{item.quantity}</strong>
                  </label>
                ))
              ) : (
                <p>No ingredients available.</p>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="instructions-section">
            <span className="section-tag">
              LET'S START COOKING
            </span>

            <h2>Cooking Instructions</h2>

            <div className="steps-list">
              {steps.length > 0 ? (
                steps.map((step, index) => (
                  <div className="step-row" key={index}>
                    <span className="step-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="step-content">
                      <h3>Step {index + 1}</h3>
                      <p>{step}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p>No cooking instructions available.</p>
              )}
            </div>
          </div>
        </section>

        {/* Rating and Review Section */}
        <section className="recipe-reviews-section">

          <div className="reviews-heading">
            <span className="section-tag">
              COMMUNITY FEEDBACK
            </span>

            <h2>Ratings & Reviews</h2>

            <p>
              Share your cooking experience with others.
            </p>
          </div>

          {/* Average Rating */}
          <div className="rating-summary">
            <div className="rating-average">
              <strong>
                {Number(recipe.averageRating || 0).toFixed(1)}
              </strong>

              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={
                      star <= Math.round(recipe.averageRating || 0)
                        ? "star-filled"
                        : "star-empty"
                    }
                  >
                    ★
                  </span>
                ))}
              </div>

              <small>
                Based on {recipe.ratingsCount || 0} reviews
              </small>
            </div>
          </div>

          {/* Review Form */}
          <div className="review-form-card">
            <h3>Write a Review</h3>

            {!isLoggedIn ? (
              <p className="review-login-message">
                Please <Link to="/login">login</Link> to rate
                and review this recipe.
              </p>
            ) : reviewSubmitted ? (
              <div className="review-success">
                <strong>
                  ✓ Thank you for your review!
                </strong>
                <p>{reviewMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit}>
                <label className="review-label">
                  Your Rating
                </label>

                <div className="star-selector">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      className={
                        star <= (hoverRating || selectedRating)
                          ? "select-star active"
                          : "select-star"
                      }
                      onClick={() => setSelectedRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      aria-label={`Rate ${star} out of 5`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <label
                  className="review-label"
                  htmlFor="reviewComment"
                >
                  Your Review
                </label>

                <textarea
                  id="reviewComment"
                  className="review-textarea"
                  placeholder="Tell us what you think about this recipe..."
                  value={reviewComment}
                  onChange={(e) =>
                    setReviewComment(e.target.value)
                  }
                  maxLength={500}
                  rows={4}
                />

                <div className="review-character-count">
                  {reviewComment.length}/500 characters
                </div>

                {reviewError && (
                  <p className="review-error">
                    {reviewError}
                  </p>
                )}

                <button
                  type="submit"
                  className="review-submit-btn"
                  disabled={reviewLoading}
                >
                  {reviewLoading
                    ? "Submitting..."
                    : "Submit Review"}
                </button>
              </form>
            )}
          </div>

          {/* Existing Reviews */}
          <div className="all-reviews">
            <h3>
              What People Say ({recipe.ratingsCount || 0})
            </h3>

            {reviews.length > 0 ? (
              reviews.map((review) => (
                <article
                  className="review-card"
                  key={review._id}
                >
                  <div className="review-card-header">
                    <div className="review-user-avatar">
                      {(review.name || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="review-user-info">
                      <strong>
                        {review.name ||
                          review.user?.name ||
                          "RecipeHub User"}
                      </strong>

                      <small>
                        {review.createdAt
                          ? new Date(
                              review.createdAt
                            ).toLocaleDateString()
                          : ""}
                      </small>
                    </div>

                    <div className="review-card-stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={
                            star <= review.rating
                              ? "star-filled"
                              : "star-empty"
                          }
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="review-comment">
                    {review.comment}
                  </p>
                </article>
              ))
            ) : (
              <div className="no-reviews">
                <span>★</span>
                <p>
                  No reviews yet. Be the first to review this
                  recipe!
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Bottom Navigation */}
        <div className="details-bottom">
          <h3>Enjoy your homemade meal!</h3>

          <Link
            to="/explore"
            className="explore-more-link"
          >
            Explore More Recipes →
          </Link>
        </div>
      </div>
    </main>
  );
}

export default RecipeDetails;
