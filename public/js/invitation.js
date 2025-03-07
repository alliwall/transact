document.addEventListener("DOMContentLoaded", function () {
  // Theme switcher
  const themeSwitch = document.querySelector(".theme-switch");
  const html = document.documentElement;

  // Check for saved theme preference
  const savedTheme = localStorage.getItem("theme") || "dark";
  html.setAttribute("data-bs-theme", savedTheme);
  if (savedTheme === "light") {
    themeSwitch.classList.add("light");
  }

  themeSwitch.addEventListener("click", function () {
    const currentTheme = html.getAttribute("data-bs-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    html.setAttribute("data-bs-theme", newTheme);
    localStorage.setItem("theme", newTheme);

    this.classList.toggle("light");
  });

  const invitationSection = document.getElementById("invitation-code-section");
  const requestFormSection = document.getElementById("request-form-section");
  const requestInvitationBtn = document.getElementById(
    "request-invitation-btn"
  );
  const backToInvitationBtn = document.getElementById("back-to-invitation");
  const invitationForm = document.getElementById("invitation-form");
  const requestForm = document.getElementById("request-form");
  const successMessage = document.getElementById("success-message");
  const errorMessage = document.getElementById("error-message");

  // Toggle between invitation code and request form
  requestInvitationBtn.addEventListener("click", function () {
    invitationSection.style.display = "none";
    requestFormSection.style.display = "block";
    successMessage.style.display = "none";
    errorMessage.style.display = "none";
  });

  backToInvitationBtn.addEventListener("click", function () {
    requestFormSection.style.display = "none";
    invitationSection.style.display = "block";
    successMessage.style.display = "none";
    errorMessage.style.display = "none";
  });

  // Handle invitation code submission
  invitationForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const code = document.getElementById("invitation-code").value.trim();

    try {
      const response = await fetch("/api/invitation/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
        credentials: "same-origin",
      });

      const data = await response.json();

      if (response.ok) {
        successMessage.textContent = "Checking your invitation code...";
        successMessage.style.display = "block";
        errorMessage.style.display = "none";

        // Extrair o parâmetro redirect_url da URL atual, se existir
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get("redirect_url") || "/";

        // Redirecionar para o URL especificado ou para a página inicial por predefinição
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1500);
      } else {
        errorMessage.textContent =
          data.error || "Failed to verify invitation code";
        errorMessage.style.display = "block";
        successMessage.style.display = "none";
      }
    } catch (error) {
      console.error("Fetch error:", error);
      errorMessage.textContent = "An error occurred. Please try again.";
      errorMessage.style.display = "block";
      successMessage.style.display = "none";
    }
  });

  // Handle request form submission
  requestForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const requestData = {
      email: document.getElementById("email").value.trim(),
      telegram_handle: document.getElementById("telegram").value.trim(),
      name: document.getElementById("name").value.trim(),
      country: document.getElementById("country").value.trim(),
      daily_volume: document.getElementById("daily-volume").value.trim(),
      referral_source: document.getElementById("referral").value.trim(),
    };

    try {
      const response = await fetch("/api/invitation/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        requestForm.reset();
        requestFormSection.style.display = "none";
        invitationSection.style.display = "block";
        successMessage.textContent =
          "Your invitation request has been submitted successfully. We will contact you soon.";
        successMessage.style.display = "block";
        errorMessage.style.display = "none";
      } else {
        errorMessage.textContent =
          data.error || "Failed to submit invitation request";
        errorMessage.style.display = "block";
        successMessage.style.display = "none";
      }
    } catch (error) {
      errorMessage.textContent = "An error occurred. Please try again.";
      errorMessage.style.display = "block";
      successMessage.style.display = "none";
    }
  });
});
