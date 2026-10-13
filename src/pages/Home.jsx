
import { useCallback, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Home.css";

const API = "https://civicfix-backend-vo7n.onrender.com/api/issues";

function getLoggedInEmail() {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) return "";

  try {
    const parsedUser = JSON.parse(storedUser);

    if (parsedUser && typeof parsedUser === "object") {
      return parsedUser.email?.trim().toLowerCase() || "";
    }

    if (typeof parsedUser === "string") {
      return parsedUser.includes("@")
        ? parsedUser.trim().toLowerCase()
        : "";
    }

    return "";
  } catch {
    return storedUser.includes("@")
      ? storedUser.trim().toLowerCase()
      : "";
  }
}

function Home() {
  const navigate = useNavigate();

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userEmail = getLoggedInEmail();

  const loadMyIssues = useCallback(async () => {
    if (!userEmail) {
      setLoading(false);
      setError("Your login details were not found. Please log in again.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API}/mine?email=${encodeURIComponent(userEmail)}`
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Unable to load your complaints."
        );
      }

      setIssues(
        Array.isArray(data)
          ? [...data].sort(
              (a, b) =>
                new Date(b.createdAt || b.created_at || 0) -
                new Date(a.createdAt || a.created_at || 0)
            )
          : []
      );
    } catch (err) {
      console.error("Could not load citizen issues:", err);
      setError(err.message || "Unable to load your complaints.");
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    // Do not redirect automatically just because a login flag is missing.
    // Show a message instead, so the Home route stays on /home.
    if (!userEmail) {
      setLoading(false);
      setError("Please log in to view your complaints.");
      return;
    }

    loadMyIssues();
  }, [userEmail, loadMyIssues]);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("role");

    navigate("/", { replace: true });
  };

  const goToHome = () => {
    navigate("/home");
  };

  const countStatus = (status) =>
    issues.filter(
      (issue) =>
        String(issue.status || "Reported").toLowerCase() ===
        status.toLowerCase()
    ).length;

  const inProgressCount = issues.filter((issue) =>
    ["verified", "assigned", "in progress", "in-progress"].includes(
      String(issue.status || "").toLowerCase()
    )
  ).length;

  const statusClass = (status) =>
    String(status || "Reported").toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="home-page">
      <nav className="navbar">
        <Link to="/home" className="logo" onClick={goToHome}>
          🏙️ CivicFix
        </Link>

        <div className="nav-links">
          <button type="button" onClick={goToHome}>
            Home
          </button>

          <button type="button" onClick={() => navigate("/report")}>
            Report Issue
          </button>

          <button
            type="button"
            onClick={() => navigate("/track-issues")}
          >
            Track Issues
          </button>

          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <main className="citizen-dashboard" id="home">
        <section className="dashboard-welcome">
          <div>
            <span className="hero-badge">CITIZEN DASHBOARD</span>
            <h1>Your community. Your voice.</h1>
            <p>
              Report civic problems, track your complaints, and follow their
              progress.
            </p>
          </div>

          <button
            className="primary-btn"
            type="button"
            onClick={() => navigate("/report")}
          >
            + Report an Issue
          </button>
        </section>

        <section className="dashboard-stats">
          <article className="stat-card">
            <span>Total complaints</span>
            <strong>{issues.length}</strong>
          </article>

          <article className="stat-card">
            <span>Reported</span>
            <strong>{countStatus("Reported")}</strong>
          </article>

          <article className="stat-card">
            <span>In progress</span>
            <strong>{inProgressCount}</strong>
          </article>

          <article className="stat-card">
            <span>Resolved</span>
            <strong>{countStatus("Resolved")}</strong>
          </article>
        </section>

        <section className="recent-issues">
          <div className="section-heading">
            <div>
              <h2>My recent complaints</h2>
              <p>Updates on the issues you reported.</p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/track-issues")}
            >
              View all →
            </button>
          </div>

          {loading ? (
            <p className="dashboard-message">
              Loading your complaints...
            </p>
          ) : error ? (
            <div className="dashboard-message error-message">
              <p>{error}</p>

              {userEmail ? (
                <button type="button" onClick={loadMyIssues}>
                  Try again
                </button>
              ) : (
                <button type="button" onClick={() => navigate("/login")}>
                  Go to Login
                </button>
              )}
            </div>
          ) : issues.length === 0 ? (
            <div className="dashboard-empty">
              <span>📍</span>
              <h3>No complaints yet</h3>
              <p>
                Report a local problem to start tracking its progress.
              </p>

              <button
                className="primary-btn"
                type="button"
                onClick={() => navigate("/report")}
              >
                Report your first issue
              </button>
            </div>
          ) : (
            <div className="recent-issue-list">
              {issues.slice(0, 5).map((issue, index) => (
                <article
                  className="recent-issue-card"
                  key={issue.id ?? issue.issueId ?? index}
                >
                  <div className="recent-issue-icon">📍</div>

                  <div className="recent-issue-details">
                    <h3>{issue.title || "Civic Issue"}</h3>

                    <p>
                      {issue.issueId || `Issue #${issue.id}`} ·{" "}
                      {issue.category || "Other"} ·{" "}
                      {issue.location || "Location not provided"}
                    </p>

                    <small>
                      Submitted{" "}
                      {formatIssueDate(
                        issue.createdAt || issue.created_at
                      )}
                    </small>

                    <p className="status-update">
                      {String(issue.status).toLowerCase() === "verified"
                        ? "Your complaint has been verified."
                        : String(issue.status).toLowerCase() === "assigned"
                        ? "Your complaint has been assigned for action."
                        : String(issue.status).toLowerCase() === "resolved"
                        ? "Your complaint has been marked as resolved."
                        : "Your complaint has been submitted and is awaiting verification."}
                    </p>
                  </div>

                  <span className={`status ${statusClass(issue.status)}`}>
                    {issue.status || "Reported"}
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer>
        © 2026 CivicFix — Building Better Communities Together.
      </footer>
    </div>
  );
}

function formatIssueDate(value) {
  if (!value) return "date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "date unavailable";
  }

  return date.toLocaleDateString("en-IN");
}

export default Home;
