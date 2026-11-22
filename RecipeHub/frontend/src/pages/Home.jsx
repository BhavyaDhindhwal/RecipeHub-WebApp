
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Home() {
  const { user } = useAuth();

  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <span className="hero-tag">
            ✨ YOUR DAILY DOSE OF FOOD INSPIRATION
          </span>

          <h1>
            Discover Recipes.
            <br />
            <span>Create Memories.</span>
          </h1>

          <p>
            Explore delicious recipes, share your cooking
            passion and plan your meals with RecipeHub.
          </p>

          <div className="hero-buttons">
            <Link to="/explore" className="primary-btn">
              Explore Recipes →
            </Link>

            {!user && (
              <Link to="/register" className="secondary-btn">
                Join Our Community
              </Link>
            )}
          </div>

          <div className="hero-stats">
            <div>
              <strong>Fresh</strong>
              <span>Food Inspiration</span>
            </div>
            <div>
              <strong>Weekly</strong>
              <span>Meal Planning</span>
            </div>
            <div>
              <strong>Community</strong>
              <span>Recipe Sharing</span>
            </div>
          </div>
        </div>

        <div className="hero-image">
          <img
            src="https://images.unsplash.com/photo-1547592180-85f173990554?w=900"
            alt="Fresh healthy food bowl"
          />

          <div className="image-badge">
            <span>🥗</span>
            <div>
              <strong>Cook Something Amazing</strong>
              <small>Made with love</small>
            </div>
          </div>
        </div>
      </section>

      <section className="intro-section">
        <span>EXPLORE YOUR TASTE</span>
        <h2>Good food brings people together.</h2>
        <p>
          Find your next favourite dish, learn new cooking
          techniques and share your own creations.
        </p>
      </section>
    </main>
  );
}

export default Home;
