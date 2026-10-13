
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ReportIssue.css";

const API_URL = "http://localhost:8080/api/issues";
const AI_URL = "http://localhost:8080/api/ai/analyze";

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

export default function ReportIssue() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    location: "",
    priority: "Medium",
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const categories = [
    "Road Damage",
    "Garbage",
    "Water Supply",
    "Streetlight",
    "Drainage",
    "Public Safety",
    "Other",
  ];

  // Navigate to the citizen Home dashboard, not the landing page.
  function goToHome() {
    navigate("/home");
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");
      e.target.value = "";
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setError("");
    setSuccess("");
  }

  function removeImage() {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImage(null);
    setPreview("");

    const input = document.getElementById("issue-image");

    if (input) {
      input.value = "";
    }
  }

  async function analyzeIssue() {
    if (!form.title.trim() || !form.description.trim()) {
      setError(
        "Enter an issue title and description before AI analysis."
      );
      setSuccess("");
      return;
    }

    setLoadingAI(true);
    setError("");
    setSuccess("");
    setAnalysis(null);

    try {
      const response = await fetch(AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title.trim(),
          category: form.category,
          description: form.description.trim(),
          location: form.location.trim(),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `AI analysis failed (HTTP ${response.status}).`
        );
      }

      setAnalysis(data);

      if (data?.priority) {
        const allowed = ["Low", "Medium", "High", "Critical"];

        const suggested = allowed.find(
          (priority) =>
            priority.toLowerCase() ===
            String(data.priority).toLowerCase()
        );

        if (suggested) {
          setForm((prev) => ({
            ...prev,
            priority: suggested,
          }));
        }
      }

      setSuccess("AI analysis completed.");
    } catch (err) {
      setError(
        err.message ||
          "AI service is unavailable. You can still submit your issue."
      );
    } finally {
      setLoadingAI(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    const email = getLoggedInEmail();

    if (!email) {
      setError("Please log in again before reporting an issue.");
      return;
    }

    if (
      !form.title.trim() ||
      !form.category ||
      !form.description.trim() ||
      !form.location.trim()
    ) {
      setError("Please complete all required fields.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
        location: form.location.trim(),
        priority: form.priority,
        imageName: image?.name || null,
        email,
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Unable to submit issue (HTTP ${response.status}).`
        );
      }

      setSuccess("Your issue was reported successfully!");

      setForm({
        title: "",
        category: "",
        description: "",
        location: "",
        priority: "Medium",
      });

      setAnalysis(null);
      removeImage();

      e.target.reset();

      setTimeout(() => {
        navigate("/track-issues");
      }, 1200);
    } catch (err) {
      setError(err.message || "Unable to submit your issue.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="report-page">
      <header className="report-hero">
        <nav className="report-nav">
          <button
            type="button"
            className="report-back"
            onClick={goToHome}
          >
            ← Back to Home
          </button>

          <span className="report-brand">
            <span className="report-brand-icon">C</span>
            CivicFix
          </span>
        </nav>

        <div className="report-hero-content">
          <span className="report-label">
            MAKE YOUR CITY BETTER
          </span>

          <h1>Report a Civic Issue</h1>

          <p>
            Spotted a problem in your neighbourhood? Tell us about it.
            Together, we can make our community cleaner, safer, and better.
          </p>
        </div>
      </header>

      <main className="report-layout">
        <section className="report-form-card">
          <div className="report-section-heading">
            <div>
              <span className="report-step-label">
                STEP 1 · ISSUE DETAILS
              </span>

              <h2>Tell us what happened</h2>

              <p>Fields marked * are required.</p>
            </div>

            <div className="report-heading-icon">📋</div>
          </div>

          {error && (
            <div
              className="report-message report-error"
              role="alert"
            >
              <span>⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div
              className="report-message report-success"
              role="status"
            >
              <span>✓</span>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="report-field">
              <label htmlFor="title">Issue title *</label>

              <input
                id="title"
                name="title"
                type="text"
                placeholder="e.g. Pothole on the main road"
                value={form.title}
                onChange={handleChange}
                maxLength={150}
                required
              />
            </div>

            <div className="report-field">
              <label htmlFor="category">Category *</label>

              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              >
                <option value="">Choose an issue category</option>

                {categories.map((category) => (
                  <option value={category} key={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="report-field">
              <div className="report-label-row">
                <label htmlFor="description">
                  Issue description *
                </label>

                <span>{form.description.length}/2000</span>
              </div>

              <textarea
                id="description"
                name="description"
                placeholder="Describe the problem, where it is happening, and how it affects people..."
                value={form.description}
                onChange={handleChange}
                maxLength={2000}
                rows={5}
                required
              />
            </div>

            <div className="report-field">
              <label htmlFor="location">Location *</label>

              <input
                id="location"
                name="location"
                type="text"
                placeholder="Street, area, landmark, or nearby address"
                value={form.location}
                onChange={handleChange}
                required
              />

              <span className="report-help">
                Be specific so the responsible team can find the issue.
              </span>
            </div>

            <div className="report-field">
              <label htmlFor="issue-image">
                Attach a photo (optional)
              </label>

              <div className="report-upload">
                <div className="report-upload-icon">📷</div>

                <div className="report-upload-text">
                  <strong>Upload an issue photo</strong>

                  <span>
                    JPG, PNG, or another image format · Max 5 MB
                  </span>
                </div>

                <input
                  id="issue-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>

              {preview && (
                <div className="report-preview">
                  <img
                    src={preview}
                    alt="Selected issue preview"
                  />

                  <div className="report-preview-info">
                    <strong>{image?.name}</strong>

                    <span>
                      {image
                        ? (image.size / 1024 / 1024).toFixed(2)
                        : "0"}{" "}
                      MB
                    </span>

                    <button
                      type="button"
                      onClick={removeImage}
                    >
                      Remove photo
                    </button>
                  </div>
                </div>
              )}

              <span className="report-help">
                Note: your current backend stores the filename only, not
                the image itself.
              </span>
            </div>

            <div className="report-priority-card">
              <div className="report-priority-copy">
                <span className="report-priority-icon">✨</span>

                <div>
                  <h3>Issue priority</h3>

                  <p>
                    Analyze with AI or select the priority yourself.
                  </p>
                </div>
              </div>

              <select
                name="priority"
                aria-label="Issue priority"
                value={form.priority}
                onChange={handleChange}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <button
              type="button"
              className="report-ai-button"
              onClick={analyzeIssue}
              disabled={loadingAI || submitting}
            >
              {loadingAI
                ? "Analyzing issue..."
                : "✨ Analyze Issue with AI"}
            </button>

            {analysis && (
              <div className="report-analysis">
                <h3>AI analysis</h3>

                {analysis.priority && (
                  <p>
                    <strong>Suggested priority:</strong>{" "}
                    {analysis.priority}
                  </p>
                )}

                {analysis.category && (
                  <p>
                    <strong>Suggested category:</strong>{" "}
                    {analysis.category}
                  </p>
                )}

                {analysis.message && <p>{analysis.message}</p>}

                {analysis.explanation && (
                  <p>{analysis.explanation}</p>
                )}

                {analysis.reason && <p>{analysis.reason}</p>}
              </div>
            )}

            <button
              type="submit"
              className="report-submit-button"
              disabled={submitting || loadingAI}
            >
              {submitting
                ? "Submitting report..."
                : "Submit Issue →"}
            </button>

            <p className="report-privacy-note">
              Your report will be associated with your logged-in account.
            </p>
          </form>
        </section>

        <aside className="report-sidebar">
          <section className="report-info-card">
            <div className="report-sidebar-icon">🏙️</div>

            <h2>Small reports. Big changes.</h2>

            <p>
              Every report helps bring attention to local problems and
              supports a better community.
            </p>
          </section>

          <section className="report-info-card report-process-card">
            <h3>What happens next?</h3>

            <div className="report-process-step">
              <span>1</span>

              <div>
                <strong>Report submitted</strong>
                <p>Your issue is recorded in CivicFix.</p>
              </div>
            </div>

            <div className="report-process-step">
              <span>2</span>

              <div>
                <strong>Issue reviewed</strong>
                <p>The responsible team can review the report.</p>
              </div>
            </div>

            <div className="report-process-step">
              <span>3</span>

              <div>
                <strong>Track progress</strong>
                <p>Check the latest status on your tracking page.</p>
              </div>
            </div>

            <button
              type="button"
              className="report-track-button"
              onClick={() => navigate("/track-issues")}
            >
              Track My Issues →
            </button>
          </section>

          <div className="report-tip">
            <span>💡</span>

            <p>
              <strong>Reporting tip</strong>
              <br />
              Include a clear location and useful details. A photo can
              help explain the problem.
            </p>
          </div>

          {/* Additional way to return to the Home dashboard */}
          <button
            type="button"
            className="report-track-button"
            onClick={goToHome}
          >
            ← Return to Home Dashboard
          </button>
        </aside>
      </main>

      <footer className="report-footer">
        CivicFix · Building better communities together.
      </footer>
    </div>
  );
}
