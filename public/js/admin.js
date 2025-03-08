document.addEventListener("DOMContentLoaded", function () {
  // Elements
  const loginSection = document.getElementById("login-section");
  const adminDashboard = document.getElementById("admin-dashboard");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const logoutBtn = document.getElementById("logout-btn");
  const navRequests = document.getElementById("nav-requests");
  const navCodes = document.getElementById("nav-codes");
  const navItemRequests = document.getElementById("nav-item-requests");
  const navItemCodes = document.getElementById("nav-item-codes");
  const requestsSection = document.getElementById("requests-section");
  const codesSection = document.getElementById("codes-section");
  const refreshRequestsBtn = document.getElementById("refresh-requests");
  const refreshCodesBtn = document.getElementById("refresh-codes");
  const requestsTableBody = document.getElementById("requests-table-body");
  const codesTableBody = document.getElementById("codes-table-body");
  const noRequests = document.getElementById("no-requests");
  const noCodes = document.getElementById("no-codes");
  const approveModal = new bootstrap.Modal(
    document.getElementById("approve-modal")
  );
  const confirmApproveBtn = document.getElementById("confirm-approve");
  const themeSwitch = document.querySelector(".theme-switch");
  const html = document.documentElement;

  // Stats elements
  const pendingCount = document.getElementById("pending-count");
  const approvedCount = document.getElementById("approved-count");
  const rejectedCount = document.getElementById("rejected-count");

  let authToken = localStorage.getItem("adminToken");

  // Theme management
  const savedTheme = localStorage.getItem("theme") || "dark";
  html.setAttribute("data-bs-theme", savedTheme);
  if (savedTheme === "light") {
    themeSwitch.classList.add("light");
  }

  // Theme toggle event listener
  themeSwitch.addEventListener("click", function () {
    const currentTheme = html.getAttribute("data-bs-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    html.setAttribute("data-bs-theme", newTheme);
    localStorage.setItem("theme", newTheme);

    this.classList.toggle("light");
  });

  // Check if user is already logged in
  if (authToken) {
    showAdminDashboard();
    loadInvitationRequests();
  } else {
    showLoginForm();
  }

  // Login form submission
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        authToken = data.token;
        localStorage.setItem("adminToken", authToken);
        loginForm.reset();
        showAdminDashboard();
        loadInvitationRequests();
      } else {
        loginError.textContent = data.error || "Login failed";
        loginError.style.display = "block";
      }
    } catch (error) {
      loginError.textContent = "An error occurred. Please try again.";
      loginError.style.display = "block";
    }
  });

  // Logout
  logoutBtn.addEventListener("click", function () {
    localStorage.removeItem("adminToken");
    showLoginForm();
  });

  // Navigation
  navRequests.addEventListener("click", function (e) {
    e.preventDefault();
    showRequestsSection();
    loadInvitationRequests();
  });

  navCodes.addEventListener("click", function (e) {
    e.preventDefault();
    showCodesSection();
    loadInvitationCodes();
  });

  // Refresh buttons
  refreshRequestsBtn.addEventListener("click", loadInvitationRequests);
  refreshCodesBtn.addEventListener("click", loadInvitationCodes);

  // Approve request
  confirmApproveBtn.addEventListener("click", async function () {
    const requestId = document.getElementById("request-id").value;
    const codeType = document.querySelector(
      'input[name="code-type"]:checked'
    ).value;

    try {
      const response = await fetch(
        `/api/admin/invitation-requests/${requestId}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ type: codeType }),
        }
      );

      if (response.ok) {
        approveModal.hide();
        loadInvitationRequests();
        // Also refresh codes since we just created a new one
        loadInvitationCodes();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to approve request");
      }
    } catch (error) {
      alert("An error occurred. Please try again.");
    }
  });

  // Helper functions
  function showLoginForm() {
    loginSection.style.display = "block";
    adminDashboard.style.display = "none";
    loginError.style.display = "none";
    logoutBtn.style.display = "none";
    navItemRequests.style.display = "none";
    navItemCodes.style.display = "none";
  }

  function showAdminDashboard() {
    loginSection.style.display = "none";
    adminDashboard.style.display = "block";
    logoutBtn.style.display = "block";
    navItemRequests.style.display = "block";
    navItemCodes.style.display = "block";
  }

  function showRequestsSection() {
    requestsSection.style.display = "block";
    codesSection.style.display = "none";
    navRequests.classList.add("active");
    navCodes.classList.remove("active");
  }

  function showCodesSection() {
    requestsSection.style.display = "none";
    codesSection.style.display = "block";
    navCodes.classList.add("active");
    navRequests.classList.remove("active");
  }

  // Update stats counters
  function updateStats(requests) {
    if (requests) {
      const pending = requests.filter((req) => req.status === "pending").length;
      const approved = requests.filter(
        (req) => req.status === "approved"
      ).length;
      const rejected = requests.filter(
        (req) => req.status === "rejected"
      ).length;

      pendingCount.textContent = pending;
      approvedCount.textContent = approved;
      rejectedCount.textContent = rejected;
    }
  }

  async function loadInvitationRequests() {
    try {
      const response = await fetch("/api/admin/invitation-requests", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("adminToken");
        showLoginForm();
        return;
      }

      const requests = await response.json();

      // Update stats
      updateStats(requests);

      if (requests.length === 0) {
        requestsTableBody.innerHTML = "";
        noRequests.style.display = "block";
      } else {
        noRequests.style.display = "none";
        renderRequestsTable(requests);
      }
    } catch (error) {
      console.error("Error loading invitation requests:", error);
      alert("Failed to load invitation requests");
    }
  }

  async function loadInvitationCodes() {
    try {
      const response = await fetch("/api/admin/invitation-codes", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("adminToken");
        showLoginForm();
        return;
      }

      const codes = await response.json();

      // Update stats
      updateStats(null);

      if (codes.length === 0) {
        codesTableBody.innerHTML = "";
        noCodes.style.display = "block";
      } else {
        noCodes.style.display = "none";
        renderCodesTable(codes);
      }
    } catch (error) {
      console.error("Error loading invitation codes:", error);
      alert("Failed to load invitation codes");
    }
  }

  function renderRequestsTable(requests) {
    requestsTableBody.innerHTML = "";

    requests.forEach((request) => {
      const row = document.createElement("tr");

      // Format date
      const createdDate = new Date(request.created_at).toLocaleDateString();

      // Set row class based on status
      if (request.status === "approved") {
        row.classList.add("table-success");
      } else if (request.status === "rejected") {
        row.classList.add("table-danger");
      }

      row.innerHTML = `
          <td>${request.id}</td>
          <td>${request.email}</td>
          <td>${request.telegram_handle}</td>
          <td>${request.name || "-"}</td>
          <td>${request.country || "-"}</td>
          <td>${request.daily_volume || "-"}</td>
          <td>${request.referral_source || "-"}</td>
          <td>${createdDate}</td>
          <td><span class="badge ${getBadgeClass(request.status)}">${
        request.status
      }</span></td>
          <td>${getRequestActions(request)}</td>
        `;

      requestsTableBody.appendChild(row);
    });

    // Add event listeners to action buttons
    document.querySelectorAll(".approve-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        document.getElementById("request-id").value = this.dataset.id;
        approveModal.show();
      });
    });

    document.querySelectorAll(".reject-btn").forEach((btn) => {
      btn.addEventListener("click", async function () {
        if (confirm("Are you sure you want to reject this request?")) {
          const requestId = this.dataset.id;

          try {
            const response = await fetch(
              `/api/admin/invitation-requests/${requestId}/reject`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${authToken}`,
                },
              }
            );

            if (response.ok) {
              loadInvitationRequests();
            } else {
              const data = await response.json();
              alert(data.error || "Failed to reject request");
            }
          } catch (error) {
            alert("An error occurred. Please try again.");
          }
        }
      });
    });
  }

  function renderCodesTable(codes) {
    codesTableBody.innerHTML = "";

    codes.forEach((code) => {
      const row = document.createElement("tr");

      // Format dates
      const createdDate = new Date(code.created_at).toLocaleDateString();
      const expiresDate = new Date(code.expires_at).toLocaleDateString();
      const lastUsedDate = code.last_used_at
        ? new Date(code.last_used_at).toLocaleDateString()
        : "Never";

      // Set row class based on status
      if (!code.is_active) {
        row.classList.add("table-danger");
      } else if (new Date(code.expires_at) < new Date()) {
        row.classList.add("table-warning");
      }

      const status = !code.is_active
        ? "Revoked"
        : new Date(code.expires_at) < new Date()
        ? "Expired"
        : "Active";

      row.innerHTML = `
          <td>${code.id}</td>
          <td><code>${code.code}</code></td>
          <td>${getCodeTypeLabel(code.type)}</td>
          <td>${code.email}</td>
          <td>${code.telegram_handle}</td>
          <td>${createdDate}</td>
          <td>${expiresDate}</td>
          <td>${lastUsedDate}</td>
          <td><span class="badge ${getStatusBadgeClass(
            status
          )}">${status}</span></td>
          <td>${getCodeActions(code)}</td>
        `;

      codesTableBody.appendChild(row);
    });

    // Add event listeners to action buttons
    document.querySelectorAll(".revoke-btn").forEach((btn) => {
      btn.addEventListener("click", async function () {
        if (confirm("Are you sure you want to revoke this invitation code?")) {
          const codeId = this.dataset.id;

          try {
            const response = await fetch(
              `/api/admin/invitation-codes/${codeId}/revoke`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${authToken}`,
                },
              }
            );

            if (response.ok) {
              loadInvitationCodes();
            } else {
              const data = await response.json();
              alert(data.error || "Failed to revoke code");
            }
          } catch (error) {
            alert("An error occurred. Please try again.");
          }
        }
      });
    });
  }

  function getBadgeClass(status) {
    switch (status) {
      case "pending":
        return "bg-warning";
      case "approved":
        return "bg-success";
      case "rejected":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case "Active":
        return "bg-success";
      case "Expired":
        return "bg-warning";
      case "Revoked":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  }

  function getRequestActions(request) {
    if (request.status === "pending") {
      return `
          <button class="btn btn-sm btn-success approve-btn" data-id="${request.id}">
            <i class="bi bi-check-circle"></i>
          </button>
          <button class="btn btn-sm btn-danger reject-btn" data-id="${request.id}">
            <i class="bi bi-x-circle"></i>
          </button>
        `;
    }
    return "-";
  }

  function getCodeActions(code) {
    if (code.is_active && new Date(code.expires_at) >= new Date()) {
      return `
          <button class="btn btn-sm btn-danger revoke-btn" data-id="${code.id}">
            <i class="bi bi-x-circle"></i> Revoke
          </button>
        `;
    }
    return "-";
  }

  function getCodeTypeLabel(type) {
    switch (type) {
      case "A":
        return "A - Payment Link";
      case "B":
        return "B - Merchant Page";
      case "C":
        return "C - Both Features";
      default:
        return type;
    }
  }
});
