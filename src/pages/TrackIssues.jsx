
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TrackIssues.css";

const API_URL = "http://localhost:8080/api/issues";

function getLoggedInEmail() {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) return "";

  try {
    const user = JSON.parse(storedUser);

    if (typeof user === "string") {
      return user.includes("@") ? user.trim().toLowerCase() : "";
    }

    return user?.email?.trim().toLowerCase() || "";
  } catch {
    return storedUser.includes("@")
      ? storedUser.trim().toLowerCase()
      : "";
  }
}

function getStatus(status) {
  const value = String(status || "Reported").toLowerCase();

  if (value.includes("resolved")) return "resolved";
  if (value.includes("assigned")) return "assigned";
  if (value.includes("verified")) return "verified";

  return "reported";
}

function getProgress(status) {
  const progress = {
    reported: 25,
    verified: 50,
    assigned: 75,
    resolved: 100,
  };

  return progress[getStatus(status)] || 25;
}

function formatDate(dateValue) {
  if (!dateValue) return "Date unavailable";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function TrackIssues() {
  const navigate = useNavigate();

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");

  // Force navigation directly to the Home page
  const goToHome = () => {
    window.location.href = "http://localhost:5173/home";
  };

  // Open the Report Issue page
  const goToReportIssue = () => {
    navigate("/report");
  };

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const email = getLoggedInEmail();

      if (!email) {
        setError("Please log in again to view your reported issues.");
        return;
      }

      const response = await fetch(
        `${API_URL}/mine?email=${encodeURIComponent(email)}`
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            (typeof data === "string" ? data : null) ||
            `Unable to load issues (HTTP ${response.status}).`
        );
      }

      setIssues(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load your issues.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const filteredIssues =
    filter === "All"
      ? issues
      : issues.filter(
          (issue) =>
            getStatus(issue.status) === filter.toLowerCase()
        );

  const resolvedCount = issues.filter(
    (issue) => getStatus(issue.status) === "resolved"
  ).length;

  const activeCount = issues.length - resolvedCount;

  return (
    <div className="track-page">
      <header className="track-hero">
        <nav className="track-nav">
          <button
            className="track-back-button"
            type="button"
            onClick={goToHome}
          >
            ← Back to Home
          </button>

          <span className="track-brand">
            <span className="track-brand-icon">C</span>
            CivicFix
          </span>
        </nav>

        <div className="track-hero-content">
          <span className="track-eyebrow">
            YOUR COMMUNITY DASHBOARD
          </span>

          <h1>Track My Issues</h1>

          <p>
            Keep an eye on your reports and follow their progress
            toward making your neighbourhood better.
          </p>

          <button
            className="track-new-button"
            type="button"
            onClick={goToReportIssue}
          >
            + Report a New Issue
          </button>
        </div>
      </header>

      <main className="track-container">
        <section className="track-stats">
          <div className="track-stat-card">
            <div className="track-stat-icon total-icon">📋</div>
            <div>
              <span>Total Reports</span>
              <strong>{issues.length}</strong>
            </div>
          </div>

          <div className="track-stat-card">
            <div className="track-stat-icon active-icon">🔄</div>
            <div>
              <span>In Progress</span>
              <strong>{activeCount}</strong>
            </div>
          </div>

          <div className="track-stat-card">
            <div className="track-stat-icon resolved-icon">✓</div>
            <div>
              <span>Resolved</span>
              <strong>{resolvedCount}</strong>
            </div>
          </div>
        </section>

        <section className="track-list-section">
          <div className="track-list-heading">
            <div>
              <span className="track-section-eyebrow">
                REPORT OVERVIEW
              </span>

              <h2>Your Reported Issues</h2>
              <p>Check the latest status of your civic reports.</p>
            </div>

            <button
              className="track-refresh-button"
              type="button"
              onClick={fetchIssues}
              disabled={loading}
            >
              ↻ {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="track-filters">
            {["All", "Reported", "Verified", "Assigned", "Resolved"].map(
              (item) => (
                <button
                  type="button"
                  key={item}
                  className={`track-filter ${
                    filter === item ? "active" : ""
                  }`}
                  onClick={() => setFilter(item)}
                >
                  {item}

                  {item === "All" && (
                    <span className="track-filter-count">
                      {issues.length}
                    </span>
                  )}
                </button>
              )
            )}
          </div>

          {loading && (
            <div className="track-state">
              <div className="track-spinner" />
              <h3>Loading your reports...</h3>
              <p>Please wait while we fetch your issues.</p>
            </div>
          )}

          {!loading && error && (
            <div className="track-state">
              <div className="track-state-icon">⚠️</div>
              <h3>Unable to Load Issues</h3>
              <p>{error}</p>

              <button
                className="track-primary-button"
                type="button"
                onClick={fetchIssues}
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && filteredIssues.length === 0 && (
            <div className="track-state">
              <div className="track-state-icon">📍</div>

              <h3>
                {issues.length === 0
                  ? "No Issues Reported Yet"
                  : "No Issues in This Category"}
              </h3>

              <p>
                {issues.length === 0
                  ? "Your submitted civic issues will appear here. Report your first issue to get started."
                  : "Try selecting another status to see your reports."}
              </p>

              {issues.length === 0 && (
                <button
                  className="track-primary-button"
                  type="button"
                  onClick={goToReportIssue}
                >
                  Report Your First Issue →
                </button>
              )}
            </div>
          )}

          {!loading && !error && filteredIssues.length > 0 && (
            <div className="track-issues-grid">
              {filteredIssues.map((issue, index) => {
                const status = getStatus(issue.status);
                const progress = getProgress(issue.status);

                return (
                  <article
                    className="track-issue-card"
                    key={issue.id ?? issue.issueId ?? index}
                  >
                    <div className="track-issue-top">
                      <div className="track-issue-category">
                        <span>📌</span>
                        {issue.category || "General Issue"}
                      </div>

                      <span className={`track-status ${status}`}>
                        <span className="track-status-dot" />
                        {issue.status || "Reported"}
                      </span>
                    </div>

                    <h3>{issue.title || "Untitled Issue"}</h3>

                    <p className="track-issue-description">
                      {issue.description || "No description provided."}
                    </p>

                    <div className="track-issue-details">
                      <div>
                        <span className="track-detail-icon">📍</span>
                        <span>
                          {issue.location || "Location unavailable"}
                        </span>
                      </div>

                      <div>
                        <span className="track-detail-icon">📅</span>
                        <span>
                          {formatDate(
                            issue.createdAt || issue.created_at
                          )}
                        </span>
                      </div>

                      <div>
                        <span className="track-detail-icon">🆔</span>
                        <span>
                          {issue.issueId || issue.id || "Pending ID"}
                        </span>
                      </div>
                    </div>

                    <div className="track-progress-section">
                      <div className="track-progress-heading">
                        <span>Resolution progress</span>
                        <strong>{progress}%</strong>
                      </div>

                      <div className="track-progress-bar">
                        <div
                          className={`track-progress-fill ${status}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="track-progress-labels">
                        <span>Reported</span>
                        <span>Verified</span>
                        <span>Assigned</span>
                        <span>Resolved</span>
                      </div>
                    </div>

                    <div className="track-issue-footer">
                      <span>
                        Priority:{" "}
                        <strong
                          className={`track-priority ${String(
                            issue.priority || "Medium"
                          ).toLowerCase()}`}
                        >
                          {issue.priority || "Medium"}
                        </strong>
                      </span>

                      <span className="track-reference">
                        CivicFix Report
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <footer className="track-footer">
        CivicFix · Building better communities together.
      </footer>
    </div>
  );
}
