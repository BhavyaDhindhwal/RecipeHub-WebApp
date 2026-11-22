import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";

const emptyForm = {
  title: "",
  description: "",
  category: "",
  imageUrl: "",
  cookingTime: "20",
  servings: "2",
  ingredients: "",
  steps: "",
};

function AddRecipe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const backPath = isAdmin ? "/admin" : "/profile";
  const editing = Boolean(id);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editing) return;
    let ignore = false;
    const loadRecipe = async () => {
      try {
        const data = await apiRequest(`/recipes/${id}`);
        if (ignore) return;
        const recipe = data.recipe;
        setForm({
          title: recipe.title || "",
          description: recipe.description || "",
          category: recipe.category || "",
          imageUrl: recipe.imageUrl || "",
          cookingTime: String(recipe.cookingTime || 20),
          servings: String(recipe.servings || 2),
          ingredients: (recipe.ingredients || []).map((item) => `${item.name}|${item.quantity}`).join("\n"),
          steps: (recipe.steps || []).join("\n"),
        });
      } catch (err) {
        if (!ignore) setError(err.message || "Unable to load recipe.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    loadRecipe();
    return () => { ignore = true; };
  }, [editing, id]);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const ingredients = form.ingredients.split("\n").map((line) => {
      const [name, ...quantityParts] = line.split("|");
      return { name: name?.trim(), quantity: quantityParts.join("|").trim() };
    }).filter((item) => item.name && item.quantity);

    const steps = form.steps.split("\n").map((step) => step.trim()).filter(Boolean);

    if (!ingredients.length || !steps.length) {
      setError("Add at least one ingredient (Name | Quantity) and one cooking step.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim().toLowerCase(),
      imageUrl: form.imageUrl.trim(),
      cookingTime: Number(form.cookingTime),
      servings: Number(form.servings),
      ingredients,
      steps,
    };

    try {
      setSaving(true);
      const result = await apiRequest(editing ? `/recipes/${id}` : "/recipes", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      if (isAdmin) {
        navigate(`/recipes/${result.recipe._id}`, { replace: true });
      } else {
        navigate("/profile", {
          replace: true,
          state: { notice: result.message },
        });
      }
    } catch (err) {
      setError(err.message || "Unable to save recipe.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading recipe form...</div>;

  return (
    <main className="add-recipe-page">
      <div className="add-recipe-container">
        <Link to={backPath} className="back-link">
          ← Back to {isAdmin ? "Dashboard" : "Profile"}
        </Link>
        <header className="add-recipe-heading">
          <span className="section-tag">SHARE YOUR COOKING</span>
          <h1>{editing ? "Edit Your Recipe" : "Add a New Recipe"}</h1>
          <p>Share ingredients and clear cooking steps with the RecipeHub community.</p>
        </header>

        <div className="add-recipe-note">
          {isAdmin
            ? "✅ As an administrator your recipes are published immediately."
            : "📝 Your recipe will be reviewed by an admin first. Once approved it appears in Explore for everyone. You can track the status in your Profile."}
        </div>

        {error && <div className="admin-alert error">{error}</div>}

        <form className="add-recipe-form" onSubmit={handleSubmit}>
          <div className="add-recipe-field">
            <label htmlFor="title">Recipe Name</label>
            <input id="title" name="title" value={form.title} onChange={handleChange} maxLength={100} required />
          </div>
          <div className="add-recipe-field">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" value={form.description} onChange={handleChange} maxLength={1000} rows={3} required />
          </div>
          <div className="add-recipe-two-columns">
            <div className="add-recipe-field">
              <label htmlFor="category">Category</label>
              <input id="category" name="category" value={form.category} onChange={handleChange} placeholder="e.g. dessert, breakfast" required />
            </div>
            <div className="add-recipe-field">
              <label htmlFor="imageUrl">Image URL</label>
              <input id="imageUrl" type="url" name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="https://..." />
            </div>
            <div className="add-recipe-field">
              <label htmlFor="cookingTime">Cooking Time (minutes)</label>
              <input id="cookingTime" type="number" name="cookingTime" min="1" value={form.cookingTime} onChange={handleChange} required />
            </div>
            <div className="add-recipe-field">
              <label htmlFor="servings">Servings</label>
              <input id="servings" type="number" name="servings" min="1" value={form.servings} onChange={handleChange} required />
            </div>
          </div>
          <div className="add-recipe-field">
            <label htmlFor="ingredients">Ingredients</label>
            <textarea id="ingredients" name="ingredients" value={form.ingredients} onChange={handleChange} rows={7} placeholder={"Use one ingredient per line:\nFlour | 2 cups\nSugar | 1 cup"} required />
            <small>Format: Ingredient name | Quantity (one per line).</small>
          </div>
          <div className="add-recipe-field">
            <label htmlFor="steps">Cooking Instructions</label>
            <textarea id="steps" name="steps" value={form.steps} onChange={handleChange} rows={7} placeholder={"Write one step per line:\nPreheat the oven.\nMix all ingredients."} required />
            <small>Write one cooking step per line.</small>
          </div>
          <button type="submit" className="add-recipe-submit" disabled={saving}>
            {saving
              ? "Saving..."
              : editing
              ? "Save Recipe Changes"
              : isAdmin
              ? "Publish Recipe"
              : "Submit for Approval"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default AddRecipe;
