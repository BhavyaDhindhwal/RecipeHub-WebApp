import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";

const MEAL_TYPES = [
  { key: "breakfast", label: "Breakfast", icon: "🌅", hint: "Start the day right" },
  { key: "lunch", label: "Lunch", icon: "🍱", hint: "Midday fuel" },
  { key: "snacks", label: "Snacks", icon: "🍪", hint: "Something light" },
  { key: "dinner", label: "Dinner", icon: "🌙", hint: "End the day well" },
];

const getMonday = (date = new Date()) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  return result;
};

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getWeekDays = (weekStart) => {
  const monday = new Date(`${weekStart}T00:00:00`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      date: formatDate(date),
      day: date.toLocaleDateString("en-IN", { weekday: "long" }),
      short: date.toLocaleDateString("en-IN", { weekday: "short" }),
      shortDate: date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    };
  });
};

// Which meal is "now" based on the time of day
const getCurrentMealKey = () => {
  const hour = new Date().getHours();
  if (hour < 11) return "breakfast";
  if (hour < 16) return "lunch";
  if (hour < 19) return "snacks";
  return "dinner";
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const validItems = (list) =>
  (list || []).filter((item) => item.recipe && typeof item.recipe === "object");

/* ---------------------------------------------------------------
   RECIPE PICKER (search + category + favourites)
---------------------------------------------------------------- */
function RecipePicker({ target, plannedIds, onPick, onClose, busy }) {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [results, setResults] = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    apiRequest("/recipes/categories")
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
    apiRequest("/recipes/favourites")
      .then((data) => setFavourites(data.favourites || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const params = new URLSearchParams({ page: "1", limit: "30" });
        if (debounced) params.set("search", debounced);
        if (category !== "all") params.set("category", category);
        const data = await apiRequest(`/recipes?${params.toString()}`);
        if (!ignore) setResults(data.recipes || []);
      } catch (err) {
        if (!ignore) setError(err.message || "Unable to load recipes");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [debounced, category]);

  const list = tab === "favourites" ? favourites : results;

  const surprise = () => {
    const options = list.filter((recipe) => !plannedIds.has(recipe._id));
    if (!options.length) return;
    onPick(options[Math.floor(Math.random() * options.length)]._id);
  };

  return (
    <div className="mp-modal-backdrop" onClick={onClose}>
      <div className="mp-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="mp-modal-header">
          <div>
            <h3>
              Add to {target.label} <span>· {target.dayLabel}</span>
            </h3>
            <p>Pick a recipe — you can add more than one.</p>
          </div>
          <button type="button" className="mp-icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="mp-picker-tabs">
          <button type="button" className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>
            All recipes
          </button>
          <button type="button" className={tab === "favourites" ? "active" : ""} onClick={() => setTab("favourites")}>
            ♥ Favourites ({favourites.length})
          </button>
          <button type="button" className="mp-surprise" onClick={surprise} disabled={busy || !list.length}>
            🎲 Surprise me
          </button>
        </div>

        {tab === "all" && (
          <>
            <input
              className="mp-search"
              type="search"
              placeholder="Search by name or ingredient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            <div className="mp-chips">
              {["all", ...categories].map((cat) => (
                <button
                  type="button"
                  key={cat}
                  className={category === cat ? "active" : ""}
                  onClick={() => setCategory(cat)}
                >
                  {cat === "all" ? "All" : cat}
                </button>
              ))}
            </div>
          </>
        )}

        {error && <div className="meal-message meal-error">{error}</div>}

        <div className="mp-picker-list">
          {loading && tab === "all" ? (
            <p className="mp-picker-empty">Loading recipes...</p>
          ) : list.length === 0 ? (
            <p className="mp-picker-empty">
              {tab === "favourites"
                ? "No favourites yet. Tap ♥ on a recipe to save it here."
                : "No recipes found. Try a different search."}
            </p>
          ) : (
            list.map((recipe) => {
              const added = plannedIds.has(recipe._id);
              return (
                <div className="mp-picker-item" key={recipe._id}>
                  {recipe.imageUrl ? (
                    <img src={recipe.imageUrl} alt={recipe.title} />
                  ) : (
                    <div className="mp-thumb-placeholder">🍽️</div>
                  )}
                  <div className="mp-picker-info">
                    <strong>{recipe.title}</strong>
                    <small>
                      {recipe.category} · ⏱ {recipe.cookingTime} min · ♟ {recipe.servings || 1}
                    </small>
                  </div>
                  <button
                    type="button"
                    className={added ? "mp-added" : "mp-add-btn"}
                    disabled={added || busy}
                    onClick={() => onPick(recipe._id)}
                  >
                    {added ? "✓ Added" : "+ Add"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   SHOPPING LIST (built from the week's planned recipes)
---------------------------------------------------------------- */
function ShoppingList({ items, weekLabel, onClose }) {
  const [checked, setChecked] = useState({});
  const [copied, setCopied] = useState(false);

  const copyList = async () => {
    const text = items
      .filter((item) => !checked[item.key])
      .map((item) => `• ${item.name} — ${item.quantities.join(" + ")}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(`Shopping list (${weekLabel})\n\n${text}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mp-modal-backdrop" onClick={onClose}>
      <div className="mp-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="mp-modal-header">
          <div>
            <h3>🛒 Shopping list</h3>
            <p>{weekLabel} · {items.length} ingredients</p>
          </div>
          <button type="button" className="mp-icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <p className="mp-picker-empty">Plan some meals this week and your ingredients will appear here.</p>
        ) : (
          <>
            <div className="mp-shop-list">
              {items.map((item) => (
                <label key={item.key} className={checked[item.key] ? "done" : ""}>
                  <input
                    type="checkbox"
                    checked={Boolean(checked[item.key])}
                    onChange={() => setChecked((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                  />
                  <span className="mp-shop-name">{item.name}</span>
                  <span className="mp-shop-qty">{item.quantities.join(" + ")}</span>
                </label>
              ))}
            </div>
            <button type="button" className="mp-primary-btn" onClick={copyList}>
              {copied ? "✓ Copied!" : "Copy remaining items"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   MAIN PAGE
---------------------------------------------------------------- */
function MealPlanner() {
  const { user } = useAuth();
  const location = useLocation();
  const fromLogin = Boolean(location.state?.fromLogin);

  const currentWeek = formatDate(getMonday());
  const today = formatDate(new Date());

  const [weekStart, setWeekStart] = useState(currentWeek);
  const [selectedDate, setSelectedDate] = useState(today);
  const [view, setView] = useState("day");
  const [mealPlan, setMealPlan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [picker, setPicker] = useState(null);
  const [showShopping, setShowShopping] = useState(false);
  const [showWelcome, setShowWelcome] = useState(fromLogin);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const isCurrentWeek = weekStart === currentWeek;
  const activeDate = weekDays.some((d) => d.date === selectedDate) ? selectedDate : weekDays[0].date;
  const activeDay = weekDays.find((d) => d.date === activeDate);

  const fetchMealPlan = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) setLoading(true);
        setError("");
        const data = await apiRequest(`/meal-plans?weekStart=${weekStart}`);
        setMealPlan(data.mealPlan?.meals || []);
      } catch (err) {
        setError(err.message || "Unable to load weekly meal plan");
      } finally {
        setLoading(false);
      }
    },
    [weekStart]
  );

  useEffect(() => {
    fetchMealPlan();
  }, [fetchMealPlan]);

  // Hide the welcome note after a few seconds
  useEffect(() => {
    if (!showWelcome) return;
    const timer = setTimeout(() => setShowWelcome(false), 6000);
    return () => clearTimeout(timer);
  }, [showWelcome]);

  const planFor = (date) => mealPlan.find((item) => item.date === date);

  const countForDay = (date) =>
    MEAL_TYPES.reduce((total, type) => total + validItems(planFor(date)?.[type.key]).length, 0);

  const totalPlanned = weekDays.reduce((total, day) => total + countForDay(day.date), 0);
  const plannedDays = weekDays.filter((day) => countForDay(day.date) > 0).length;

  const weekEnd = new Date(`${weekStart}T00:00:00`);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekLabel = `${new Date(`${weekStart}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  })} - ${weekEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;

  /* ---------- actions ---------- */
  const flash = (text) => {
    setMessage(text);
    setError("");
    setTimeout(() => setMessage((current) => (current === text ? "" : current)), 3500);
  };

  const addRecipe = async (recipeId) => {
    if (!picker) return;
    try {
      setBusy(true);
      setError("");
      await apiRequest("/meal-plans/add", {
        method: "POST",
        body: JSON.stringify({
          weekStart,
          date: picker.date,
          mealType: picker.mealType,
          recipeId,
        }),
      });
      await fetchMealPlan(false);
      flash("Recipe added to your meal plan!");
    } catch (err) {
      setError(err.message || "Unable to add recipe");
    } finally {
      setBusy(false);
    }
  };

  const removeRecipe = async (date, mealType, recipeId) => {
    try {
      setBusy(true);
      setError("");
      await apiRequest("/meal-plans/remove", {
        method: "DELETE",
        body: JSON.stringify({ weekStart, date, mealType, recipeId }),
      });
      await fetchMealPlan(false);
      flash("Recipe removed from your meal plan.");
    } catch (err) {
      setError(err.message || "Unable to remove recipe");
    } finally {
      setBusy(false);
    }
  };

  const copyDay = async (toDate) => {
    if (!toDate) return;
    try {
      setBusy(true);
      setError("");
      await apiRequest("/meal-plans/copy-day", {
        method: "POST",
        body: JSON.stringify({ weekStart, fromDate: activeDate, toDate }),
      });
      await fetchMealPlan(false);
      const target = weekDays.find((d) => d.date === toDate);
      flash(`Copied ${activeDay.day}'s meals to ${target?.day}.`);
    } catch (err) {
      setError(err.message || "Unable to copy day");
    } finally {
      setBusy(false);
    }
  };

  const clearDay = async () => {
    if (!window.confirm(`Clear all meals planned for ${activeDay.day}?`)) return;
    try {
      setBusy(true);
      setError("");
      await apiRequest("/meal-plans/clear-day", {
        method: "DELETE",
        body: JSON.stringify({ weekStart, date: activeDate }),
      });
      await fetchMealPlan(false);
      flash(`${activeDay.day} cleared.`);
    } catch (err) {
      setError(err.message || "Unable to clear day");
    } finally {
      setBusy(false);
    }
  };

  const changeWeek = (amount) => {
    const monday = new Date(`${weekStart}T00:00:00`);
    monday.setDate(monday.getDate() + amount * 7);
    const next = formatDate(monday);
    setWeekStart(next);
    setSelectedDate(next === currentWeek ? today : next);
    setMessage("");
    setError("");
  };

  const goToToday = () => {
    setWeekStart(currentWeek);
    setSelectedDate(today);
    setView("day");
  };

  const openPicker = (date, mealType) => {
    const type = MEAL_TYPES.find((t) => t.key === mealType);
    const day = weekDays.find((d) => d.date === date);
    setPicker({
      date,
      mealType,
      label: type.label,
      dayLabel: date === today ? "Today" : day.day,
    });
  };

  /* ---------- derived data ---------- */
  const pickerPlannedIds = useMemo(() => {
    if (!picker) return new Set();
    const items = validItems(planFor(picker.date)?.[picker.mealType]);
    return new Set(items.map((item) => item.recipe._id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picker, mealPlan]);

  const shoppingItems = useMemo(() => {
    const map = new Map();
    mealPlan.forEach((day) => {
      MEAL_TYPES.forEach((type) => {
        validItems(day[type.key]).forEach(({ recipe }) => {
          (recipe.ingredients || []).forEach((ingredient) => {
            const key = ingredient.name.trim().toLowerCase();
            if (!map.has(key)) {
              map.set(key, { key, name: ingredient.name.trim(), quantities: [] });
            }
            map.get(key).quantities.push(ingredient.quantity);
          });
        });
      });
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [mealPlan]);

  /* ---------- today summary banner ---------- */
  const currentMeal = MEAL_TYPES.find((t) => t.key === getCurrentMealKey());
  const todayItems = validItems(planFor(today)?.[currentMeal.key]);
  const todayCount = isCurrentWeek ? countForDay(today) : 0;

  /* ---------- slot renderer (day view) ---------- */
  const renderSlot = (type, date) => {
    const items = validItems(planFor(date)?.[type.key]);
    const isNow = date === today && type.key === currentMeal.key;

    return (
      <section className={`mp-slot ${isNow ? "now" : ""}`} key={type.key}>
        <header className="mp-slot-header">
          <div>
            <span className="mp-slot-icon">{type.icon}</span>
            <h3>{type.label}</h3>
            {isNow && <span className="mp-now-pill">NOW</span>}
          </div>
          <button type="button" className="mp-add-btn" onClick={() => openPicker(date, type.key)}>
            + Add recipe
          </button>
        </header>

        {items.length === 0 ? (
          <button type="button" className="mp-empty-slot" onClick={() => openPicker(date, type.key)}>
            <span>＋</span>
            <div>
              <strong>Nothing planned</strong>
              <small>{type.hint} — tap to choose a recipe</small>
            </div>
          </button>
        ) : (
          <div className="mp-slot-items">
            {items.map(({ recipe }) => (
              <article className="mp-recipe" key={recipe._id}>
                <Link to={`/recipes/${recipe._id}`} className="mp-recipe-link">
                  {recipe.imageUrl ? (
                    <img src={recipe.imageUrl} alt={recipe.title} />
                  ) : (
                    <div className="mp-thumb-placeholder">🍽️</div>
                  )}
                  <div className="mp-recipe-info">
                    <strong>{recipe.title}</strong>
                    <small>
                      ⏱ {recipe.cookingTime} min · ♟ {recipe.servings || 1} · {recipe.category}
                    </small>
                  </div>
                </Link>
                <button
                  type="button"
                  className="mp-remove-btn"
                  title="Remove from plan"
                  disabled={busy}
                  onClick={() => removeRecipe(date, type.key, recipe._id)}
                >
                  ×
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    );
  };

  return (
    <main className="meal-planner-page">
      <div className="meal-planner-container">
        {/* ---------- TODAY BANNER ---------- */}
        <section className="mp-banner">
          <div>
            <span className="section-tag">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}
            </span>
            <h1>
              {getGreeting()}, <span>{user?.name?.split(" ")[0] || "Chef"}!</span>
            </h1>

            {showWelcome && (
              <p className="mp-welcome">👋 Welcome back! Here is what is on your plate today.</p>
            )}

            {!isCurrentWeek ? (
              <p className="mp-banner-text">You are viewing another week. Tap “Back to today” to see today's meals.</p>
            ) : todayCount === 0 ? (
              <p className="mp-banner-text">
                You haven't planned any meals for today yet. Add a recipe below to get started.
              </p>
            ) : todayItems.length > 0 ? (
              <p className="mp-banner-text">
                {currentMeal.icon} <strong>{currentMeal.label}:</strong>{" "}
                {todayItems.map((item) => item.recipe.title).join(", ")}
              </p>
            ) : (
              <p className="mp-banner-text">
                {currentMeal.icon} No {currentMeal.label.toLowerCase()} planned yet — you have {todayCount} other
                meal{todayCount > 1 ? "s" : ""} today.
              </p>
            )}
          </div>

          <div className="mp-banner-stats">
            <div>
              <strong>{todayCount}</strong>
              <small>Today</small>
            </div>
            <div>
              <strong>{totalPlanned}</strong>
              <small>This week</small>
            </div>
            <div>
              <strong>{plannedDays}/7</strong>
              <small>Days planned</small>
            </div>
          </div>
        </section>

        {/* ---------- CONTROLS ---------- */}
        <section className="mp-controls">
          <div className="mp-week-nav">
            <button type="button" onClick={() => changeWeek(-1)} aria-label="Previous week">
              ←
            </button>
            <div>
              <strong>{weekLabel}</strong>
              <small>{isCurrentWeek ? "This week" : "Other week"}</small>
            </div>
            <button type="button" onClick={() => changeWeek(1)} aria-label="Next week">
              →
            </button>
          </div>

          <div className="mp-control-actions">
            {(!isCurrentWeek || activeDate !== today) && (
              <button type="button" className="mp-ghost-btn" onClick={goToToday}>
                📍 Back to today
              </button>
            )}

            <div className="mp-toggle">
              <button type="button" className={view === "day" ? "active" : ""} onClick={() => setView("day")}>
                Day
              </button>
              <button type="button" className={view === "week" ? "active" : ""} onClick={() => setView("week")}>
                Week
              </button>
            </div>

            <button type="button" className="mp-ghost-btn" onClick={() => setShowShopping(true)}>
              🛒 Shopping list
            </button>
          </div>
        </section>

        {error && <div className="meal-message meal-error">{error}</div>}
        {message && <div className="meal-message meal-success">{message}</div>}

        {loading ? (
          <div className="meal-loading">Loading your meal plan...</div>
        ) : view === "day" ? (
          <>
            {/* DAY TABS */}
            <div className="mp-day-tabs">
              {weekDays.map((day) => {
                const count = countForDay(day.date);
                return (
                  <button
                    type="button"
                    key={day.date}
                    className={`${day.date === activeDate ? "active" : ""} ${day.date === today ? "is-today" : ""}`}
                    onClick={() => setSelectedDate(day.date)}
                  >
                    <small>{day.short}</small>
                    <strong>{day.shortDate.split(" ")[0]}</strong>
                    <span className={count ? "has-meals" : ""}>{count ? `${count} planned` : "empty"}</span>
                  </button>
                );
              })}
            </div>

            {/* DAY HEADER + TOOLS */}
            <div className="mp-day-header">
              <div>
                <h2>
                  {activeDate === today ? "Today" : activeDay.day}
                  <span> · {activeDay.shortDate}</span>
                </h2>
                <p>{countForDay(activeDate)} recipe(s) planned</p>
              </div>

              <div className="mp-day-tools">
                <select
                  value=""
                  disabled={busy || countForDay(activeDate) === 0}
                  onChange={(e) => copyDay(e.target.value)}
                >
                  <option value="">Copy this day to...</option>
                  {weekDays
                    .filter((d) => d.date !== activeDate)
                    .map((d) => (
                      <option key={d.date} value={d.date}>
                        {d.day}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  className="mp-ghost-btn danger"
                  disabled={busy || countForDay(activeDate) === 0}
                  onClick={clearDay}
                >
                  Clear day
                </button>
              </div>
            </div>

            <div className="mp-slots">{MEAL_TYPES.map((type) => renderSlot(type, activeDate))}</div>
          </>
        ) : (
          /* WEEK VIEW */
          <section className="mp-week-grid">
            {weekDays.map((day) => (
              <article className={`mp-week-card ${day.date === today ? "is-today" : ""}`} key={day.date}>
                <header>
                  <div>
                    <h3>{day.day}</h3>
                    <small>{day.shortDate}</small>
                  </div>
                  {day.date === today && <span className="mp-now-pill">TODAY</span>}
                </header>

                {MEAL_TYPES.map((type) => {
                  const items = validItems(planFor(day.date)?.[type.key]);
                  return (
                    <div className="mp-week-slot" key={type.key}>
                      <div className="mp-week-slot-title">
                        <span>
                          {type.icon} {type.label}
                        </span>
                        <button
                          type="button"
                          title={`Add ${type.label}`}
                          onClick={() => openPicker(day.date, type.key)}
                        >
                          +
                        </button>
                      </div>
                      {items.length === 0 ? (
                        <p className="mp-week-empty">—</p>
                      ) : (
                        items.map(({ recipe }) => (
                          <div className="mp-week-item" key={recipe._id}>
                            <Link to={`/recipes/${recipe._id}`}>{recipe.title}</Link>
                            <button
                              type="button"
                              disabled={busy}
                              title="Remove"
                              onClick={() => removeRecipe(day.date, type.key, recipe._id)}
                            >
                              ×
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}

                <button
                  type="button"
                  className="mp-ghost-btn small"
                  onClick={() => {
                    setSelectedDate(day.date);
                    setView("day");
                  }}
                >
                  Open day →
                </button>
              </article>
            ))}
          </section>
        )}

        <div className="meal-planner-tip">
          <span>💡</span>
          <p>
            <strong>Tip:</strong> Use <em>Copy this day to...</em> for repeat meals, then open the 🛒 Shopping list to
            get every ingredient for the week in one place.
          </p>
        </div>
      </div>

      {picker && (
        <RecipePicker target={picker} plannedIds={pickerPlannedIds} busy={busy} onPick={addRecipe} onClose={() => setPicker(null)} />
      )}

      {showShopping && <ShoppingList items={shoppingItems} weekLabel={weekLabel} onClose={() => setShowShopping(false)} />}
    </main>
  );
}

export default MealPlanner;
