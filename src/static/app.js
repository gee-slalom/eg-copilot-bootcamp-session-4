document.addEventListener("DOMContentLoaded", () => {
  const capabilitiesList = document.getElementById("capabilities-list");
  const messageDiv = document.getElementById("message");
  const emailInput = document.getElementById("email");

  let lastCapabilities = null;

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Surface frontend errors in the UI (helps when devtools aren't easily accessible).
  window.addEventListener("error", (event) => {
    const message = event?.error?.message || event?.message || "Unknown error";
    showMessage(`UI error: ${message}`, "error");
  });

  window.addEventListener("unhandledrejection", (event) => {
    const message = event?.reason?.message || String(event?.reason || "Unknown error");
    showMessage(`UI error: ${message}`, "error");
  });

  function getEmailOrWarn() {
    const email = (emailInput.value || "").trim();
    if (!email) {
      showMessage("Enter your email to register/unregister.", "info");
      return null;
    }
    return email;
  }

  function renderCapabilities(capabilities) {
    if (!capabilities) {
      return;
    }

    const currentEmail = (emailInput.value || "").trim().toLowerCase();
    capabilitiesList.innerHTML = "";

    Object.entries(capabilities).forEach(([name, details]) => {
      const capabilityCard = document.createElement("div");
      capabilityCard.className = "capability-card";

      const availableCapacity = details.capacity || 0;
      const consultants = Array.isArray(details.consultants) ? details.consultants : [];
      const currentConsultants = consultants.length;
      const isRegistered =
        currentEmail && consultants.some((email) => (email || "").toLowerCase() === currentEmail);

      const levels = Array.isArray(details.skill_levels) ? details.skill_levels : [];
      const certifications = Array.isArray(details.certifications) ? details.certifications : [];
      const verticals = Array.isArray(details.industry_verticals) ? details.industry_verticals : [];

      const levelsHtml =
        levels.length > 0
          ? `<div class="chips">${levels
              .map((level) => `<span class="chip chip--level">${level}</span>`)
              .join("")}</div>`
          : `<p class="muted">No skill levels specified</p>`;

      const certificationsHtml =
        certifications.length > 0
          ? `<ul class="bullets">${certifications
              .map((cert) => `<li>${cert}</li>`)
              .join("")}</ul>`
          : `<p class="muted">No certifications listed</p>`;

      const verticalsHtml =
        verticals.length > 0
          ? `<div class="chips">${verticals
              .map((v) => `<span class="chip chip--tag">${v}</span>`)
              .join("")}</div>`
          : `<p class="muted">Not specified</p>`;

      const consultantsHtml =
        consultants.length > 0
          ? `<ul class="consultants-list">
              ${consultants
                .map((email) => `<li>${email}${isRegistered && (email || "").toLowerCase() === currentEmail ? " <span class=\"you\">(you)</span>" : ""}</li>`)
                .join("")}
            </ul>`
          : `<p class="muted"><em>No consultants registered yet</em></p>`;

      capabilityCard.innerHTML = `
        <div class="card-header">
          <h4>${name}</h4>
          <div class="card-actions">
            <button class="btn btn--primary" data-action="register" data-capability="${name}" ${isRegistered ? "disabled" : ""}>
              ${isRegistered ? "Registered" : "Register"}
            </button>
            <button class="btn btn--ghost" data-action="unregister" data-capability="${name}" ${!isRegistered ? "disabled" : ""}>
              Unregister
            </button>
          </div>
        </div>

        <p class="description">${details.description}</p>
        <div class="meta">
          <div><span class="meta-label">Practice Area</span><span class="meta-value">${details.practice_area}</span></div>
          <div><span class="meta-label">Capacity</span><span class="meta-value">${availableCapacity} hours/week</span></div>
          <div><span class="meta-label">Registered</span><span class="meta-value">${currentConsultants} consultants</span></div>
        </div>

        <div class="card-grid">
          <div>
            <h5>Skill levels</h5>
            ${levelsHtml}
          </div>
          <div>
            <h5>Certifications</h5>
            ${certificationsHtml}
          </div>
        </div>

        <div class="card-grid">
          <div>
            <h5>Industry verticals</h5>
            ${verticalsHtml}
          </div>
          <div>
            <h5>Registered consultants</h5>
            ${consultantsHtml}
          </div>
        </div>
      `;

      capabilitiesList.appendChild(capabilityCard);
    });
  }

  // Function to fetch capabilities from API
  async function fetchCapabilities() {
    try {
      const response = await fetch("/capabilities");
      if (!response.ok) {
        throw new Error(`Failed to load capabilities (${response.status})`);
      }
      const capabilities = await response.json();

      lastCapabilities = capabilities;

      renderCapabilities(capabilities);
    } catch (error) {
      capabilitiesList.innerHTML = "<p>Failed to load capabilities. Please try again later.</p>";
      showMessage(
        "Could not load capabilities. If this persists, refresh the page.",
        "error"
      );
      console.error("Error fetching capabilities:", error);
    }
  }

  async function handleCardAction(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const email = getEmailOrWarn();
    if (!email) {
      return;
    }

    const capability = button.getAttribute("data-capability");
    const action = button.getAttribute("data-action");
    const method = action === "register" ? "POST" : "DELETE";
    const endpoint = action === "register" ? "register" : "unregister";

    try {
      const response = await fetch(
        `/capabilities/${encodeURIComponent(
          capability
        )}/${endpoint}?email=${encodeURIComponent(email)}`,
        {
          method,
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        fetchCapabilities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage(
        action === "register"
          ? "Failed to register. Please try again."
          : "Failed to unregister. Please try again.",
        "error"
      );
      console.error("Error updating registration:", error);
    }
  }

  capabilitiesList.addEventListener("click", handleCardAction);

  emailInput.addEventListener("input", () => {
    renderCapabilities(lastCapabilities);
  });

  // Initialize app
  fetchCapabilities();
});
