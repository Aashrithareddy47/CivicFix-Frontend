
import "./AdminDashboard.css";
import React, { useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:8080/api/issues";

const STATUSES = ["Reported", "Verified", "Assigned", "Resolved"];

function AdminDashboard() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [updatingId, setUpdatingId] = useState(null);

  // Load all complaints from Spring Boot.
  const loadIssues = async () => {
    try {
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`Unable to load issues: HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("The server did not return a list of complaints.");
      }

      setIssues(data);
    } catch (err) {
      console.error("Loading complaints failed:", err);
      setError(err.message || "Unable to load complaints.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, []);

  // Update the status of an existing complaint.
  const updateStatus = async (id, newStatus) => {
    if (updatingId !== null) return;

    if (!STATUSES.includes(newStatus)) {
      setError(`Invalid status: ${newStatus}`);
      return;
    }

    const previousIssue = issues.find(
      (issue) => String(issue.id) === String(id)
    );

    if (!previousIssue) {
      setError("Complaint not found in the current dashboard.");
      return;
    }

    const previousStatus = previousIssue.status || "Reported";

    if (previousStatus === newStatus) return;

    setUpdatingId(id);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/${encodeURIComponent(id)}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      // Read the response as text so backend errors are visible.
      const responseText = await response.text();

      if (!response.ok) {
        console.error(
          "Backend status update failed:",
          response.status,
          responseText
        );

        throw new Error(
          `Status update failed (${response.status}): ${
            responseText || "Check the Spring Boot terminal."
          }`
        );
      }

      let serverIssue = {};

      if (responseText.trim()) {
        try {
          serverIssue = JSON.parse(responseText);
        } catch {
          serverIssue = {};
        }
      }

      // Update the existing row. Do not remove the complaint.
      setIssues((currentIssues) =>
        currentIssues.map((issue) =>
          String(issue.id) === String(id)
            ? {
                ...issue,
                ...serverIssue,
                status: serverIssue.status || newStatus,
              }
            : issue
        )
      );

      // Reload from the backend to confirm the saved state.
      await loadIssues();
    } catch (err) {
      console.error("Could not update complaint status:", err);
      setError(err.message || "Could not update the complaint status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const stats = useMemo(
    () => ({
      total: issues.length,
      reported: issues.filter((issue) => issue.status === "Reported").length,
      inProgress: issues.filter(
        (issue) =>
          issue.status === "Verified" || issue.status === "Assigned"
      ).length,
      resolved: issues.filter((issue) => issue.status === "Resolved").length,
    }),
    [issues]
  );

  const filteredIssues = useMemo(() => {
    const query = search.trim().toLowerCase();

    return issues.filter((issue) => {
      const searchableValues = [
        issue.issueId,
        issue.title,
        issue.category,
        issue.location,
        issue.priority,
        issue.status,
      ];

      const matchesSearch = searchableValues.some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      );

      const matchesStatus =
        statusFilter === "All" || issue.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [issues, search, statusFilter]);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <a href="/admin-dashboard" className="admin-brand">
          <span className="brand-icon">C</span>
          <span>
            <strong>CivicFix</strong>
            <small>ADMINISTRATION</small>
          </span>
        </a>

        <div className="sidebar-section-label">WORKSPACE</div>

        <nav className="admin-nav">
          <a
            href="/admin-dashboard"
            className="admin-nav-link active"
          >
            <span className="nav-icon">▦</span> Dashboard
          </a>

          <a href="#complaints" className="admin-nav-link">
            <span className="nav-icon">▤</span> All Complaints
            <span className="nav-count">{stats.total}</span>
          </a>
        </nav>

        <div className="sidebar-section-label">MANAGEMENT</div>

        <nav className="admin-nav">
          <button
            type="button"
            className="admin-nav-link"
            onClick={() => setStatusFilter("Reported")}
          >
            <span className="nav-icon">◷</span> Pending Issues
            <span className="nav-count">{stats.reported}</span>
          </button>

          <button
            type="button"
            className="admin-nav-link"
            onClick={() => setStatusFilter("Resolved")}
          >
            <span className="nav-icon">✓</span> Resolved Issues
            <span className="nav-count">{stats.resolved}</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help-icon">i</div>
          <div>
            <strong>Keep your city moving</strong>
            <p>Every issue deserves attention.</p>
          </div>
        </div>

        <button
          type="button"
          className="admin-logout-btn"
          onClick={handleLogout}
        >
          <span>↪</span> Logout
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>Dashboard</strong>
          </div>

          <div className="admin-profile">
            <div className="admin-avatar">A</div>
            <div className="admin-profile-info">
              <strong>Administrator</strong>
              <span>City Operations</span>
            </div>
          </div>
        </header>

        <div className="admin-content">
          <section className="admin-welcome">
            <div>
              <span className="eyebrow">CITY OPERATIONS CENTER</span>
              <h1>Admin Dashboard</h1>
              <p>
                Monitor citizen complaints and help make your city better.
              </p>
            </div>
            <div className="welcome-decoration" aria-hidden="true">
              ⌂
            </div>
          </section>

          <section className="admin-stats">
            <article className="stat-card">
              <div className="stat-card-top">
                <span>Total complaints</span>
                <span className="stat-icon stat-blue">▤</span>
              </div>
              <strong className="stat-number">{stats.total}</strong>
              <span className="stat-caption">All submitted issues</span>
            </article>

            <article className="stat-card">
              <div className="stat-card-top">
                <span>Awaiting action</span>
                <span className="stat-icon stat-orange">◷</span>
              </div>
              <strong className="stat-number">{stats.reported}</strong>
              <span className="stat-caption">Reported complaints</span>
            </article>

            <article className="stat-card">
              <div className="stat-card-top">
                <span>In progress</span>
                <span className="stat-icon stat-purple">↻</span>
              </div>
              <strong className="stat-number">{stats.inProgress}</strong>
              <span className="stat-caption">Verified or assigned</span>
            </article>

            <article className="stat-card">
              <div className="stat-card-top">
                <span>Resolved</span>
                <span className="stat-icon stat-green">✓</span>
              </div>
              <strong className="stat-number">{stats.resolved}</strong>
              <span className="stat-caption">Successfully resolved</span>
            </article>
          </section>

          <section className="complaints-panel" id="complaints">
            <div className="panel-heading">
              <div>
                <h2>Complaint Management</h2>
                <p>Review reports and update their progress.</p>
              </div>

              <button
                className="refresh-button"
                onClick={loadIssues}
                type="button"
                disabled={loading}
              >
                ↻ Refresh
              </button>
            </div>

            {error && (
              <div className="admin-error" role="alert">
                {error}
              </div>
            )}

            <div className="complaint-toolbar">
              <label className="admin-search">
                <span>⌕</span>
                <input
                  type="search"
                  placeholder="Search ID, title, category or location..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search complaints"
                />
              </label>

              <select
                className="filter-select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter by status"
              >
                <option value="All">All statuses</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="admin-state">
                <div className="admin-spinner" />
                <strong>Loading complaints</strong>
                <p>Getting the latest reports from the server...</p>
              </div>
            ) : (
              <div className="table-scroll">
                <table className="complaints-table">
                  <thead>
                    <tr>
                      <th>COMPLAINT</th>
                      <th>CATEGORY</th>
                      <th>LOCATION</th>
                      <th>PRIORITY</th>
                      <th>STATUS</th>
                      <th>UPDATE STATUS</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredIssues.map((issue) => (
                      <tr key={issue.id}>
                        <td>
                          <div className="complaint-title">
                            <strong>
                              {issue.title || "Untitled complaint"}
                            </strong>
                            <span>
                              {issue.issueId || `ISS-${issue.id}`}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span className="category-text">
                            {issue.category || "Other"}
                          </span>
                        </td>

                        <td>
                          <div className="location-cell">
                            <span>⌖</span>
                            <span>
                              {issue.location || "Not specified"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`priority-badge priority-${String(
                              issue.priority || "medium"
                            ).toLowerCase()}`}
                          >
                            <span className="priority-dot" />
                            {issue.priority || "Medium"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`status-badge status-${String(
                              issue.status || "reported"
                            ).toLowerCase()}`}
                          >
                            {issue.status || "Reported"}
                          </span>
                        </td>

                        <td>
                          <select
                            className="status-select"
                            value={issue.status || "Reported"}
                            disabled={updatingId !== null}
                            onChange={(event) =>
                              updateStatus(issue.id, event.target.value)
                            }
                            aria-label={`Update status for ${
                              issue.issueId || issue.title
                            }`}
                          >
                            {STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>

                          {updatingId === issue.id && (
                            <span className="updating-label">
                              Saving...
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredIssues.length === 0 && (
                  <div className="admin-state empty-state">
                    <div className="empty-state-icon">⌕</div>
                    <strong>No complaints found</strong>
                    <p>
                      {issues.length > 0
                        ? "Try changing your search or status filter."
                        : "Citizen complaints will appear here when submitted."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {!loading && issues.length > 0 && (
              <div className="table-footer">
                Showing <strong>{filteredIssues.length}</strong> of{" "}
                <strong>{issues.length}</strong> complaints
              </div>
            )}
          </section>

          <footer className="admin-footer">
            <span>© {new Date().getFullYear()} CivicFix</span>
            <span>Building cleaner, safer communities.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
