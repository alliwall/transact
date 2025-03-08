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

  // Populate countries dropdown
  const countrySelect = document.getElementById("country");
  populateCountries(countrySelect);

  // Handle referral source dropdown
  const referralSourceSelect = document.getElementById("referral-source");
  const otherReferralContainer = document.getElementById(
    "other-referral-container"
  );
  const otherReferralTextarea = document.getElementById("other-referral");
  const otherReferralCharCount = document.getElementById(
    "other-referral-char-count"
  );

  referralSourceSelect.addEventListener("change", function () {
    if (this.value === "Other") {
      otherReferralContainer.style.display = "block";
      otherReferralTextarea.required = true;
    } else {
      otherReferralContainer.style.display = "none";
      otherReferralTextarea.required = false;
    }
  });

  // Character counter for other referral textarea
  otherReferralTextarea.addEventListener("input", function () {
    const currentLength = this.value.length;
    otherReferralCharCount.textContent = currentLength;

    if (currentLength >= 500) {
      otherReferralCharCount.classList.add("text-danger");
    } else {
      otherReferralCharCount.classList.remove("text-danger");
    }
  });

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
    
    if (!code) {
      showError("Please enter an invitation code");
      return;
    }
    
    // Disable submit button and show spinner
    setVerifyButtonLoading(true);

    try {
      // First, check the current session status
      const sessionCheckResponse = await fetch("/api/session-status", {
        method: "GET",
        credentials: "include",
      });
      
      const sessionData = await sessionCheckResponse.json();
      console.log("Current session before verification:", sessionData);

      // Now verify the invitation code
      const response = await fetch("/api/invitation/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
        credentials: "include",
      });

      const data = await response.json();
      console.log("Verification response:", data);

      if (response.ok) {
        // Show success message with a loading indicator
        successMessage.innerHTML = `
          <div class="d-flex align-items-center">
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            <span>Checking your invitation code...</span>
          </div>
        `;
        successMessage.style.display = "block";
        errorMessage.style.display = "none";

        // Check session status again to confirm it was updated
        const postVerifySessionCheck = await fetch("/api/session-status", {
          method: "GET",
          credentials: "include",
        });
        
        const updatedSessionData = await postVerifySessionCheck.json();
        console.log("Session after verification:", updatedSessionData);

        // Extract the redirect_url parameter from the current URL, if it exists
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get("redirect_url") || "/";

        // Update success message with redirect information
        successMessage.innerHTML = `
          <div class="d-flex align-items-center">
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            <span>Invitation code verified! Redirecting you...</span>
          </div>
        `;

        // Add a small delay to ensure session is fully processed
        setTimeout(() => {
          // Redirect to the specified URL or to the default page by default
          window.location.href = redirectUrl;
        }, 1500);
      } else {
        // Re-enable submit button and hide spinner
        setVerifyButtonLoading(false);
        
        errorMessage.textContent =
          data.error || "Failed to verify invitation code";
        errorMessage.style.display = "block";
        successMessage.style.display = "none";
      }
    } catch (error) {
      // Re-enable submit button and hide spinner in case of error
      setVerifyButtonLoading(false);
      
      console.error("Fetch error:", error);
      errorMessage.textContent = "An error occurred. Please try again.";
      errorMessage.style.display = "block";
      successMessage.style.display = "none";
    }
  });

  // Function to set the verify button loading state
  function setVerifyButtonLoading(isLoading) {
    const verifyButton = document.getElementById("verify-code-btn");
    const verifySpinner = document.getElementById("verify-spinner");
    const verifyText = document.getElementById("verify-text");
    
    if (isLoading) {
      // Disable button, show spinner
      verifyButton.disabled = true;
      verifySpinner.classList.remove("d-none");
      verifyText.textContent = "Verifying...";
    } else {
      // Enable button, hide spinner
      verifyButton.disabled = false;
      verifySpinner.classList.add("d-none");
      verifyText.textContent = "Submit";
    }
  }

  // Handle request form submission
  requestForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    
    // Basic form validation
    if (!validateForm()) {
      return;
    }

    // Disable submit button and show spinner
    setSubmitButtonLoading(true);

    // Get referral source value
    let referralSource = document.getElementById("referral-source").value;
    if (referralSource === "Other") {
      referralSource = document.getElementById("other-referral").value.trim();
    }
    
    // Get country value
    const country = document.getElementById("country").value;

    const requestData = {
      email: document.getElementById("email").value.trim(),
      telegram_handle: document.getElementById("telegram").value.trim() || null,
      whatsapp: document.getElementById("whatsapp").value.trim() || null,
      name: document.getElementById("name").value.trim() || null,
      country: country || null,
      daily_volume: document.getElementById("daily-volume").value || null,
      referral_source: referralSource || null,
    };

    try {
      const response = await fetch("/api/invitation/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        // Show success message
        successMessage.textContent =
          "Your invitation request has been submitted successfully. We will contact you soon.";
        successMessage.style.display = "block";
        errorMessage.style.display = "none";
        
        // Add a small delay before resetting the form and UI
        setTimeout(() => {
          // Re-enable submit button and hide spinner
          setSubmitButtonLoading(false);
          
          // Reset form and UI
          requestForm.reset();
          requestFormSection.style.display = "none";
          invitationSection.style.display = "block";
          
          // Hide the other referral container
          otherReferralContainer.style.display = "none";
        }, 1000);
      } else {
        // Re-enable submit button and hide spinner
        setSubmitButtonLoading(false);
        
        errorMessage.textContent =
          data.error || "Failed to submit invitation request";
        errorMessage.style.display = "block";
        successMessage.style.display = "none";
      }
    } catch (error) {
      // Re-enable submit button and hide spinner in case of error
      setSubmitButtonLoading(false);
      
      errorMessage.textContent = "An error occurred. Please try again.";
      errorMessage.style.display = "block";
      successMessage.style.display = "none";
    }
  });

  // Function to set the submit button loading state
  function setSubmitButtonLoading(isLoading) {
    const submitButton = document.getElementById("submit-request-btn");
    const submitSpinner = document.getElementById("submit-spinner");
    const submitText = document.getElementById("submit-text");
    const backButton = document.getElementById("back-to-invitation");
    
    if (isLoading) {
      // Disable buttons, show spinner
      submitButton.disabled = true;
      backButton.disabled = true;
      submitSpinner.classList.remove("d-none");
      submitText.textContent = "Processing...";
    } else {
      // Enable buttons, hide spinner
      submitButton.disabled = false;
      backButton.disabled = false;
      submitSpinner.classList.add("d-none");
      submitText.textContent = "Submit Request";
    }
  }

  // Form validation function
  function validateForm() {
    // Email is required
    const email = document.getElementById("email").value.trim();
    if (!email) {
      showError("Email address is required");
      return false;
    }

    const telegram = document.getElementById("telegram").value.trim();
    const whatsapp = document.getElementById("whatsapp").value.trim();
    // At least one contact method is required (either Telegram or WhatsApp)
    // if (!telegram && !whatsapp) {
    //   showError(
    //     "At least one contact method (Telegram or WhatsApp) is required"
    //   );
    //   return false;
    // }

    // Validate Telegram format if provided
    if (telegram && !/^[a-zA-Z0-9_]{5,32}$/.test(telegram)) {
      showError(
        "Telegram handle must be 5-32 characters and contain only letters, numbers, and underscores"
      );
      return false;
    }

    // Validate WhatsApp format if provided
    if (whatsapp && !/^[+0-9]+$/.test(whatsapp)) {
      showError(
        "WhatsApp number must contain only numbers and optionally a + sign"
      );
      return false;
    }

    // If referral source is "Other", the other field is required
    const referralSource = document.getElementById("referral-source").value;
    if (referralSource === "Other") {
      const otherReferral = document
        .getElementById("other-referral")
        .value.trim();
      if (!otherReferral) {
        showError("Please specify how you heard about Transact");
        return false;
      }
    }

    return true;
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
    successMessage.style.display = "none";

    // Scroll to error message
    errorMessage.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // Function to populate countries dropdown
  function populateCountries(selectElement) {
    const countries = [
      "Afghanistan",
      "Albania",
      "Algeria",
      "Andorra",
      "Angola",
      "Antigua and Barbuda",
      "Argentina",
      "Armenia",
      "Australia",
      "Austria",
      "Azerbaijan",
      "Bahamas",
      "Bahrain",
      "Bangladesh",
      "Barbados",
      "Belarus",
      "Belgium",
      "Belize",
      "Benin",
      "Bhutan",
      "Bolivia",
      "Bosnia and Herzegovina",
      "Botswana",
      "Brazil",
      "Brunei",
      "Bulgaria",
      "Burkina Faso",
      "Burundi",
      "Cabo Verde",
      "Cambodia",
      "Cameroon",
      "Canada",
      "Central African Republic",
      "Chad",
      "Chile",
      "China",
      "Colombia",
      "Comoros",
      "Congo",
      "Costa Rica",
      "Croatia",
      "Cuba",
      "Cyprus",
      "Czech Republic",
      "Denmark",
      "Djibouti",
      "Dominica",
      "Dominican Republic",
      "East Timor",
      "Ecuador",
      "Egypt",
      "El Salvador",
      "Equatorial Guinea",
      "Eritrea",
      "Estonia",
      "Eswatini",
      "Ethiopia",
      "Fiji",
      "Finland",
      "France",
      "Gabon",
      "Gambia",
      "Georgia",
      "Germany",
      "Ghana",
      "Greece",
      "Grenada",
      "Guatemala",
      "Guinea",
      "Guinea-Bissau",
      "Guyana",
      "Haiti",
      "Honduras",
      "Hungary",
      "Iceland",
      "India",
      "Indonesia",
      "Iran",
      "Iraq",
      "Ireland",
      "Israel",
      "Italy",
      "Jamaica",
      "Japan",
      "Jordan",
      "Kazakhstan",
      "Kenya",
      "Kiribati",
      "Korea, North",
      "Korea, South",
      "Kosovo",
      "Kuwait",
      "Kyrgyzstan",
      "Laos",
      "Latvia",
      "Lebanon",
      "Lesotho",
      "Liberia",
      "Libya",
      "Liechtenstein",
      "Lithuania",
      "Luxembourg",
      "Madagascar",
      "Malawi",
      "Malaysia",
      "Maldives",
      "Mali",
      "Malta",
      "Marshall Islands",
      "Mauritania",
      "Mauritius",
      "Mexico",
      "Micronesia",
      "Moldova",
      "Monaco",
      "Mongolia",
      "Montenegro",
      "Morocco",
      "Mozambique",
      "Myanmar",
      "Namibia",
      "Nauru",
      "Nepal",
      "Netherlands",
      "New Zealand",
      "Nicaragua",
      "Niger",
      "Nigeria",
      "North Macedonia",
      "Norway",
      "Oman",
      "Pakistan",
      "Palau",
      "Palestine",
      "Panama",
      "Papua New Guinea",
      "Paraguay",
      "Peru",
      "Philippines",
      "Poland",
      "Portugal",
      "Qatar",
      "Romania",
      "Russia",
      "Rwanda",
      "Saint Kitts and Nevis",
      "Saint Lucia",
      "Saint Vincent and the Grenadines",
      "Samoa",
      "San Marino",
      "Sao Tome and Principe",
      "Saudi Arabia",
      "Senegal",
      "Serbia",
      "Seychelles",
      "Sierra Leone",
      "Singapore",
      "Slovakia",
      "Slovenia",
      "Solomon Islands",
      "Somalia",
      "South Africa",
      "South Sudan",
      "Spain",
      "Sri Lanka",
      "Sudan",
      "Suriname",
      "Sweden",
      "Switzerland",
      "Syria",
      "Taiwan",
      "Tajikistan",
      "Tanzania",
      "Thailand",
      "Togo",
      "Tonga",
      "Trinidad and Tobago",
      "Tunisia",
      "Turkey",
      "Turkmenistan",
      "Tuvalu",
      "Uganda",
      "Ukraine",
      "United Arab Emirates",
      "United Kingdom",
      "United States",
      "Uruguay",
      "Uzbekistan",
      "Vanuatu",
      "Vatican City",
      "Venezuela",
      "Vietnam",
      "Yemen",
      "Zambia",
      "Zimbabwe",
    ];

    // Get the countries optgroup
    const countriesOptgroup = selectElement.querySelector(
      'optgroup[label="Countries"]'
    );

    if (!countriesOptgroup) {
      console.error("Countries optgroup not found");
      return;
    }

    // Sort countries alphabetically
    countries.sort();

    // Add countries to the optgroup
    countries.forEach((country) => {
      const option = document.createElement("option");
      option.value = country;
      option.textContent = country;
      countriesOptgroup.appendChild(option);
    });
  }
});
