import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [topRecipes, setTopRecipes] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [pendingRecipes, setPendingRecipes] = useState([]);
  const [reports, setReports] = useState([]);
  const [removedRecipes, setRemovedRecipes] = useState([]);

  const [allRecipes, setAllRecipes] = useState([]);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [recipeStatus, setRecipeStatus] = useState("");

  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadCore = useCallback(async () => {
    try {
      setError("");
      const [statData, reportData, removedData, pendingData] = await Promise.all([
        apiRequest("/admin/stats"),
        apiRequest("/reports"),
        apiRequest("/recipes/removed"),
        apiRequest("/recipes/admin/all?status=pending"),
      ]);
      setStats(statData.stats);
      setCategoryBreakdown(statData.categoryBreakdown || []);
      setTopRecipes(statData.topRecipes || []);
      setRecentUsers(statData.recentUsers || []);
      setReports(reportData.reports || []);
      setRemovedRecipes(removedData.recipes || []);
      setPendingRecipes(pendingData.recipes || []);
    } catch (err) {
      setError(err.message || "Unable to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCore();
  }, [loadCore]);

  // All recipes tab (search + status filter)
  const loadAllRecipes = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (recipeSearch.trim()) params.set("search", recipeSearch.trim());
      if (recipeStatus) params.set("status", recipeStatus);
      const data = await apiRequest(`/recipes/admin/all?${params.toString()}`);
      setAllRecipes(data.recipes || []);
    } catch (err) {
      setError(err.message || "Unable to load recipes.");
    }
  }, [recipeSearch, recipeStatus]);

  useEffect(() => {
    if (activeTab !== "recipes") return;
    const timer = setTimeout(loadAllRecipes, 300);
    return () => clearTimeout(timer);
  }, [activeTab, loadAllRecipes]);

  // Users tab
  const loadUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (userSearch.trim()) params.set("search", userSearch.trim());
      const data = await apiRequest(`/admin/users?${params.toString()}`);
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || "Unable to load users.");
    }
  }, [userSearch]);

  useEffect(() => {
    if (activeTab !== "users") return;
    const timer = setTimeout(loadUsers, 300);
    return () => clearTimeout(timer);
  }, [activeTab, loadUsers]);

  const refreshAll = async () => {
    await loadCore();
    if (activeTab === "recipes") await loadAllRecipes();
  };

  // Generic runner for admin actions
  const runAction = async (id, request, fallbackMessage) => {
    try {
      setBusyId(id);
      setError("");
      setMessage("");
      const data = await request();
      setMessage(data?.message || fallbackMessage);
      await refreshAll();
    } catch (err) {
      setError(err.message || "Action failed.");
    } finally {
      setBusyId("");
    }
  };

  const approveRecipe = (recipe) => {
    if (!window.confirm(`Approve "${recipe.title}" and make it public?`)) return;
    runAction(recipe._id, () => apiRequest(`/recipes/${recipe._id}/approve`, { method: "PATCH" }), "Recipe approved.");
  };

  const rejectRecipe = (recipe) => {
    const reason = window.prompt(`Why are you rejecting "${recipe.title}"? (the author will see this)`);
    if (reason === null) return;
    if (!reason.trim()) {
      setError("Please give a reason for rejecting the recipe.");
      return;
    }
    runAction(
      recipe._id,
      () => apiRequest(`/recipes/${recipe._id}/reject`, { method: "PATCH", body: JSON.stringify({ reason }) }),
      "Recipe rejected."
    );
  };

  const removeRecipe = (recipe) => {
    const reason = window.prompt(`Remove "${recipe.title}" from public listings? Add a reason (optional):`);
    if (reason === null) return;
    runAction(
      recipe._id,
      () => apiRequest(`/recipes/${recipe._id}/remove`, { method: "PATCH", body: JSON.stringify({ reason }) }),
      "Recipe removed."
    );
  };

  const restoreRecipe = (recipeId) => {
    if (!window.confirm("Restore this recipe to public listings?")) return;
    runAction(recipeId, () => apiRequest(`/recipes/${recipeId}/restore`, { method: "PATCH" }), "Recipe restored.");
  };

  const takeAction = (reportId, action) => {
    const prompt =
      action === "remove"
        ? "Remove this recipe from all public listings? You can restore it later."
        : "Dismiss this report? The recipe will remain visible.";
    if (!window.confirm(prompt)) return;
    runAction(
      reportId,
      () => apiRequest(`/reports/${reportId}/action`, { method: "PATCH", body: JSON.stringify({ action }) }),
      "Moderation action completed."
    );
  };

  if (loading) {
    return (
      <main className="admin-page">
        <div className="loading">Loading Admin Dashboard...</div>
      </main>
    );
  }

  const pendingReports = reports.filter((item) => item.status === "pending");
  const maxCategory = Math.max(1, ...categoryBreakdown.map((c) => c.count));

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "approvals", label: "Approvals", count: pendingRecipes.length, alert: pendingRecipes.length > 0 },
    { key: "reports", label: "Reports", count: pendingReports.length, alert: pendingReports.length > 0 },
    { key: "recipes", label: "All Recipes" },
    { key: "removed", label: "Removed", count: removedRecipes.length },
    { key: "users", label: "Users", count: stats?.totalUsers },
  ];

  const recipeCard = (recipe, actions) => (
    <article className="admin-removed-card" key={recipe._id}>
      {recipe.imageUrl && <img src={recipe.imageUrl} alt={recipe.title} />}
      <div className="admin-removed-info">
        <div className="admin-report-title-row">
          <h3>{recipe.title}</h3>
          <span className={`admin-status status-${recipe.isRemoved ? "removed" : recipe.status || "approved"}`}>
            {recipe.isRemoved ? "removed" : recipe.status || "approved"}
          </span>
        </div>
        <p>{recipe.description}</p>
        <small>
          {recipe.category} · by {recipe.createdBy?.name || "Unknown"}
          {recipe.createdBy?.email ? ` (${recipe.createdBy.email})` : ""} · {formatDate(recipe.createdAt)}
        </small>
        {recipe.status === "rejected" && recipe.rejectionReason && (
          <p>
            <strong>Rejected:</strong> {recipe.rejectionReason}
          </p>
        )}
      </div>
      <div className="admin-row-actions">{actions}</div>
    </article>
  );

  return (
    <main className="admin-page">
      <div className="admin-container">
        <header className="admin-heading">
          <div>
            <span className="section-tag">RECIPEHUB CONTROL CENTER</span>
            <h1>
              Admin <span>Dashboard</span>
            </h1>
            <p>Manage recipes, approvals, reports and users in one place.</p>
          </div>
          <div className="admin-heading-actions">
            <Link to="/add-recipe" className="admin-add-btn">
              + Add Recipe
            </Link>
            <span className="admin-role-pill">Administrator</span>
          </div>
        </header>

        {message && <div className="admin-alert success">{message}</div>}
        {error && <div className="admin-alert error">{error}</div>}

        <div className="admin-tabs">
          {tabs.map((tab) => (
            <button key={tab.key} className={activeTab === tab.key ? "active" : ""} onClick={() => setActiveTab(tab.key)}>
              {tab.label}
              {tab.count !== undefined && (
                <span className={`admin-tab-count ${tab.alert ? "alert" : ""}`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ---------------- OVERVIEW ---------------- */}
        {activeTab === "overview" && stats && (
          <>
            <section className="admin-stats admin-stats-grid">
              <article className="admin-stat-card">
                <span>Users</span>
                <strong>{stats.totalUsers}</strong>
                <small>+{stats.newUsers} this week</small>
              </article>
              <article className="admin-stat-card">
                <span>Live Recipes</span>
                <strong>{stats.totalRecipes}</strong>
                <small>Public on Explore</small>
              </article>
              <article className="admin-stat-card clickable" onClick={() => setActiveTab("approvals")}>
                <span>Awaiting Approval</span>
                <strong>{stats.pendingRecipes}</strong>
                <small>Review now →</small>
              </article>
              <article className="admin-stat-card clickable" onClick={() => setActiveTab("reports")}>
                <span>Pending Reports</span>
                <strong>{stats.pendingReports}</strong>
                <small>of {stats.totalReports} total</small>
              </article>
              <article className="admin-stat-card">
                <span>Removed Recipes</span>
                <strong>{stats.removedRecipes}</strong>
                <small>Restorable</small>
              </article>
              <article className="admin-stat-card">
                <span>Meal Plans Created</span>
                <strong>{stats.mealPlans}</strong>
                <small>Weekly plans by users</small>
              </article>
            </section>

            <section className="admin-overview-grid">
              <div className="admin-panel">
                <h3>Recipes by category</h3>
                {categoryBreakdown.length === 0 ? (
                  <p className="admin-muted">No recipes yet.</p>
                ) : (
                  categoryBreakdown.map((item) => (
                    <div className="admin-bar-row" key={item.category}>
                      <span>{item.category}</span>
                      <div className="admin-bar">
                        <div style={{ width: `${(item.count / maxCategory) * 100}%` }} />
                      </div>
                      <strong>{item.count}</strong>
                    </div>
                  ))
                )}
              </div>

              <div className="admin-panel">
                <h3>Top rated recipes</h3>
                {topRecipes.length === 0 ? (
                  <p className="admin-muted">No ratings yet.</p>
                ) : (
                  topRecipes.map((recipe) => (
                    <Link to={`/recipes/${recipe._id}`} className="admin-mini-row" key={recipe._id}>
                      <span>{recipe.title}</span>
                      <strong>
                        ★ {Number(recipe.averageRating).toFixed(1)} <small>({recipe.ratingsCount})</small>
                      </strong>
                    </Link>
                  ))
                )}
              </div>

              <div className="admin-panel">
                <h3>New members</h3>
                {recentUsers.length === 0 ? (
                  <p className="admin-muted">No users yet.</p>
                ) : (
                  recentUsers.map((member) => (
                    <div className="admin-mini-row" key={member._id}>
                      <span>
                        {member.name}
                        <small>{member.email}</small>
                      </span>
                      <small>{formatDate(member.createdAt)}</small>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}

        {/* ---------------- APPROVALS ---------------- */}
        {activeTab === "approvals" && (
          <section className="admin-list">
            {pendingRecipes.length === 0 ? (
              <div className="admin-empty">
                <h3>All caught up 🎉</h3>
                <p>User-submitted recipes waiting for review will appear here.</p>
              </div>
            ) : (
              pendingRecipes.map((recipe) =>
                recipeCard(
                  recipe,
                  <>
                    <Link to={`/recipes/${recipe._id}`} className="admin-link-btn">
                      Preview
                    </Link>
                    <button disabled={busyId === recipe._id} className="admin-restore-btn" onClick={() => approveRecipe(recipe)}>
                      Approve
                    </button>
                    <button disabled={busyId === recipe._id} className="admin-remove-btn" onClick={() => rejectRecipe(recipe)}>
                      Reject
                    </button>
                  </>
                )
              )
            )}
          </section>
        )}

        {/* ---------------- REPORTS ---------------- */}
        {activeTab === "reports" && (
          <section className="admin-list">
            {reports.length === 0 ? (
              <div className="admin-empty">
                <h3>No reports yet</h3>
                <p>New recipe reports will appear here.</p>
              </div>
            ) : (
              reports.map((report) => (
                <article className="admin-report-card" key={report._id}>
                  <div className="admin-report-main">
                    {report.recipe?.imageUrl && <img src={report.recipe.imageUrl} alt={report.recipe.title} />}
                    <div className="admin-report-info">
                      <div className="admin-report-title-row">
                        <h3>{report.recipe?.title || "Recipe unavailable"}</h3>
                        <span className={`admin-status status-${report.status}`}>{report.status}</span>
                      </div>
                      <p>
                        <strong>Reason:</strong> {report.reason}
                      </p>
                      <p>
                        <strong>Description:</strong> {report.description || "No additional details."}
                      </p>
                      <p>
                        <strong>Reported by:</strong> {report.reportedBy?.name || "Unknown user"}{" "}
                        {report.reportedBy?.email ? `(${report.reportedBy.email})` : ""}
                      </p>
                      <small>Reported: {new Date(report.createdAt).toLocaleString()}</small>
                      {report.recipe?._id && (
                        <p className="admin-recipe-link">
                          <Link to={`/recipes/${report.recipe._id}`}>Open recipe details</Link>
                        </p>
                      )}
                    </div>
                  </div>
                  {!["dismissed", "removed"].includes(report.status) && (
                    <div className="admin-card-actions">
                      <button disabled={busyId === report._id} className="admin-dismiss-btn" onClick={() => takeAction(report._id, "dismiss")}>
                        Dismiss Report
                      </button>
                      <button disabled={busyId === report._id} className="admin-remove-btn" onClick={() => takeAction(report._id, "remove")}>
                        {busyId === report._id ? "Processing..." : "Remove Recipe"}
                      </button>
                    </div>
                  )}
                </article>
              ))
            )}
          </section>
        )}

        {/* ---------------- ALL RECIPES ---------------- */}
        {activeTab === "recipes" && (
          <>
            <div className="admin-filters">
              <input
                type="search"
                placeholder="Search recipes by title..."
                value={recipeSearch}
                onChange={(e) => setRecipeSearch(e.target.value)}
              />
              <select value={recipeStatus} onChange={(e) => setRecipeStatus(e.target.value)}>
                <option value="">All statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="removed">Removed</option>
              </select>
            </div>
            <section className="admin-list">
              {allRecipes.length === 0 ? (
                <div className="admin-empty">
                  <h3>No recipes found</h3>
                  <p>Try a different search or filter.</p>
                </div>
              ) : (
                allRecipes.map((recipe) =>
                  recipeCard(
                    recipe,
                    <>
                      <Link to={`/recipes/${recipe._id}`} className="admin-link-btn">
                        View
                      </Link>
                      <Link to={`/recipes/${recipe._id}/edit`} className="admin-link-btn">
                        Edit
                      </Link>
                      {recipe.isRemoved ? (
                        <button disabled={busyId === recipe._id} className="admin-restore-btn" onClick={() => restoreRecipe(recipe._id)}>
                          Restore
                        </button>
                      ) : (
                        <button disabled={busyId === recipe._id} className="admin-remove-btn" onClick={() => removeRecipe(recipe)}>
                          Remove
                        </button>
                      )}
                    </>
                  )
                )
              )}
            </section>
          </>
        )}

        {/* ---------------- REMOVED ---------------- */}
        {activeTab === "removed" && (
          <section className="admin-list">
            {removedRecipes.length === 0 ? (
              <div className="admin-empty">
                <h3>No removed recipes</h3>
                <p>Recipes removed by admin can be restored here.</p>
              </div>
            ) : (
              removedRecipes.map((recipe) => (
                <article className="admin-removed-card" key={recipe._id}>
                  {recipe.imageUrl && <img src={recipe.imageUrl} alt={recipe.title} />}
                  <div className="admin-removed-info">
                    <h3>{recipe.title}</h3>
                    <p>{recipe.description}</p>
                    <small>Removed {recipe.removedAt ? new Date(recipe.removedAt).toLocaleString() : ""}</small>
                    {recipe.removalReason && (
                      <p>
                        <strong>Reason:</strong> {recipe.removalReason}
                      </p>
                    )}
                  </div>
                  <button disabled={busyId === recipe._id} className="admin-restore-btn" onClick={() => restoreRecipe(recipe._id)}>
                    {busyId === recipe._id ? "Restoring..." : "Restore Recipe"}
                  </button>
                </article>
              ))
            )}
          </section>
        )}

        {/* ---------------- USERS ---------------- */}
        {activeTab === "users" && (
          <>
            <div className="admin-filters">
              <input
                type="search"
                placeholder="Search users by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
            <section className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Recipes</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="admin-muted">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((member) => (
                      <tr key={member._id}>
                        <td>{member.name}</td>
                        <td>{member.email}</td>
                        <td>
                          <span className={`admin-status status-${member.role === "admin" ? "approved" : "reviewed"}`}>
                            {member.role}
                          </span>
                        </td>
                        <td>{member.recipeCount}</td>
                        <td>{formatDate(member.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default AdminDashboard;
