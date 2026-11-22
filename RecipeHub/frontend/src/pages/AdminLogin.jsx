import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminLogin() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(form);
      if (data.user?.role !== "admin") {
        logout();
        setError("This account does not have administrator access.");
        return;
      }
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Admin login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-container admin-login-page">
      <div className="auth-card">
        <div className="auth-brand">RecipeHub <span>Admin</span></div>
        <h1>Administrator Login</h1>
        <p className="auth-subtitle">Sign in with your authorized admin account.</p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>Email Address</label>
          <input type="email" value={form.email} placeholder="Admin email" onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <label>Password</label>
          <input type="password" value={form.password} placeholder="Password" onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <button className="auth-submit" disabled={loading}>{loading ? "Signing in..." : "Admin Login"}</button>
        </form>
        <p className="auth-footer"><Link to="/login">Back to User Login</Link></p>
      </div>
    </main>
  );
}
export default AdminLogin;
