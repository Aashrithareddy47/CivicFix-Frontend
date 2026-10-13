
import { Link } from "react-router-dom";
import "./Landing.css";

function Landing() {
  return (
    <div className="landing-page">
      <nav className="landing-navbar">
        <Link to="/" className="landing-logo">
          🏙️ CivicFix
        </Link>

        <div className="landing-nav-links">
          <a href="#about">About</a>
          <Link to="/login">Login</Link>
          <Link to="/register" className="landing-nav-button">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="landing-hero">
        <div className="landing-content">
          <span className="landing-tag">
            BUILDING BETTER COMMUNITIES
            FOR ADMIN DASHBOARD EMAIL:admin@gmail.com,password:admin
          </span>

          <h1>
            Your City.
            <br />
            Your Voice.
            <br />
            <span>Our Responsibility.</span>
          </h1>

          <p>
            Report potholes, garbage, broken streetlights, and
            other civic problems. CivicFix connects citizens
            with the people working to make their city better.
          </p>

          <div className="landing-actions">
            <Link to="/register" className="landing-primary-button">
              Report an Issue →
            </Link>

            <Link to="/login" className="landing-secondary-button">
              Login
            </Link>
          </div>

          <div className="landing-features">
            <div>
              <strong>Easy</strong>
              <span>Issue reporting</span>
            </div>

            <div>
              <strong>Connected</strong>
              <span>Citizen community</span>
            </div>

            <div>
              <strong>Accountable</strong>
              <span>Better civic services</span>
            </div>
          </div>
        </div>

        <div className="landing-visual">
          <div className="landing-city-icon">🏙️</div>
          <div className="landing-floating-card">
            <span>📍</span>
            <div>
              <strong>See a problem?</strong>
              <p>Report it. Help fix it.</p>
            </div>
          </div>
        </div>
      </main>

      <section id="about" className="landing-about">
        <h2>A better city starts with you.</h2>
        <p>
          CivicFix makes it easier to report local issues and
          support cleaner, safer, better-maintained communities.
        </p>
      </section>

      <footer className="landing-footer">
        © {new Date().getFullYear()} CivicFix. Together for a better city.
      </footer>
    </div>
  );
}

export default Landing;
