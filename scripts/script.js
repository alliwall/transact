// Constants and variables
const form = document.getElementById("transaction-form");
const paymentResult = document.getElementById("payment-result");
const submitBtn = document.getElementById("submit-btn");
const submitText = document.getElementById("submit-text");
const loadingSpinner = document.getElementById("loading-spinner");
const themeToggle = document.getElementById("theme-toggle");
const themeToggleIcon = themeToggle.querySelector("i");

// Minimum amounts for each provider
const minAmounts = {
  wert: 1,
  werteur: 1,
  guardarian: 20,
  particle: 30,
  robinhood: 5,
  stripe: 2,
  coinbase: 2,
  transak: 15,
  sardine: 30,
  simpleswap: 30,
  banxa: 20,
  utorg: 50,
  simplex: 50,
  changenow: 20,
  transfi: 70,
  alchemypay: 5,
  mercuryo: 30,
  topper: 10,
  swipelux: 14,
  kado: 15,
  unlimit: 10,
  bitnovo: 10,
  rampnetwork: 4,
  upi: 100,
  interac: 100,
  moonpay: 20,
};

// Check for saved theme preference
const savedTheme = localStorage.getItem("theme") || "light";
if (savedTheme === "dark") {
  document.body.setAttribute("data-theme", "dark");
  themeToggleIcon.classList.remove("fa-moon");
  themeToggleIcon.classList.add("fa-sun");
}

// Theme toggle functionality
themeToggle.addEventListener("click", () => {
  const currentTheme = document.body.getAttribute("data-theme") || "light";
  const newTheme = currentTheme === "light" ? "dark" : "light";

  document.body.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);

  if (newTheme === "dark") {
    themeToggleIcon.classList.remove("fa-moon");
    themeToggleIcon.classList.add("fa-sun");
  } else {
    themeToggleIcon.classList.remove("fa-sun");
    themeToggleIcon.classList.add("fa-moon");
  }
});

// Provider filtering functionality
const filterButtons = document.querySelectorAll(".provider-filter button");
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // Remove active class from all buttons
    filterButtons.forEach((btn) => btn.classList.remove("active"));

    // Add active class to clicked button
    button.classList.add("active");

    const filter = button.getAttribute("data-filter");
    const providerItems = document.querySelectorAll(".provider-item");

    providerItems.forEach((item) => {
      if (
        filter === "all" ||
        item.getAttribute("data-currency") === filter ||
        item.getAttribute("data-currency") === "all"
      ) {
        item.style.display = "block";
      } else {
        item.style.display = "none";
      }
    });
  });
});

// Provider search functionality
const providerSearch = document.getElementById("provider-search");
providerSearch.addEventListener("input", () => {
  const searchTerm = providerSearch.value.toLowerCase();
  const providerItems = document.querySelectorAll(".provider-item");

  providerItems.forEach((item) => {
    const providerName = item
      .querySelector(".provider-name")
      .textContent.toLowerCase();

    if (providerName.includes(searchTerm)) {
      item.style.display = "block";
    } else {
      item.style.display = "none";
    }
  });
});

// Function to show validation errors
function showValidationError(message) {
  const errorAlert = document.createElement("div");
  errorAlert.className = "alert alert-danger alert-dismissible fade show";
  errorAlert.innerHTML = `
    <i class="fas fa-exclamation-circle me-2"></i>${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  paymentResult.innerHTML = "";
  paymentResult.appendChild(errorAlert);
  paymentResult.classList.add("show");

  // Scroll to the error
  setTimeout(() => {
    errorAlert.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 100);
}

// Function to start loading state
function startLoading() {
  submitText.textContent = "Processing...";
  loadingSpinner.classList.remove("d-none");
  submitBtn.disabled = true;
}

// Function to stop loading state
function stopLoading() {
  submitText.textContent = "Generate Payment Link";
  loadingSpinner.classList.add("d-none");
  submitBtn.disabled = false;
}

// Function to copy text to clipboard
function copyToClipboard(text, button) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      // Show copied feedback
      const feedbackElement = button.querySelector(".copy-feedback");
      feedbackElement.classList.add("show-feedback");

      setTimeout(() => {
        feedbackElement.classList.remove("show-feedback");
      }, 2000);
    })
    .catch((err) => {
      console.error("Error copying: ", err);
      showToast("Failed to copy to clipboard", "danger");
    });
}

// Form validation and submission
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  // Basic form validation
  if (!form.checkValidity()) {
    event.stopPropagation();
    form.classList.add("was-validated");
    return;
  }

  // Get form values
  const walletAddress = document.getElementById("wallet_address").value.trim();
  const emailAddress = document.getElementById("email_address").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const currencySelect = document.getElementById("currency");
  const currency = currencySelect.value;
  const provider = document.querySelector(
    'input[name="provider"]:checked'
  ).value;

  // Validate wallet address (basic Ethereum format)
  const walletRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!walletRegex.test(walletAddress)) {
    showValidationError(
      "Wallet address must be a valid Ethereum address (0x... format)"
    );
    return;
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailAddress)) {
    showValidationError("Please enter a valid email address");
    return;
  }

  // Validate minimum amount
  if (amount < minAmounts[provider]) {
    showValidationError(
      `Minimum amount for ${provider} is ${minAmounts[provider]} ${currency}`
    );
    return;
  }

  // Validate currency compatibility with provider
  if (
    currency !== "USD" &&
    (provider === "wert" ||
      provider === "stripe" ||
      provider === "transfi" ||
      provider === "robinhood" ||
      provider === "rampnetwork")
  ) {
    showValidationError(`${provider} only supports USD payments`);
    return;
  }

  if (currency !== "INR" && provider === "upi") {
    showValidationError(`${provider} only supports INR payments`);
    return;
  }

  if (currency !== "CAD" && provider === "interac") {
    showValidationError(`${provider} only supports CAD payments`);
    return;
  }

  if (currency !== "EUR" && provider === "werteur") {
    showValidationError(`${provider} only supports EUR payments`);
    return;
  }

  // Start loading process
  startLoading();
  paymentResult.innerHTML = "";
  paymentResult.classList.remove("show");

  // Generate tracking ID for the payment
  const payoutTrackingId = `https://paygate.to/payment-link/invoice.php?payment=${Date.now()}_${
    Math.floor(Math.random() * 9000000) + 1000000
  }`;
  const callback = encodeURIComponent(payoutTrackingId);

  try {
    // API call
    const response = await fetch(
      `https://api.paygate.to/control/wallet.php?address=${walletAddress}&callback=${callback}`
    );

    if (!response.ok) {
      throw new Error(`Server response error: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.address_in) {
      const addressIn = data.address_in;
      const callbackUrl = data.callback_url;
      const customerEmail = encodeURIComponent(emailAddress);
      const paymentLink = `https://payment.transact.st/process-payment.php?address=${addressIn}&amount=${amount}&provider=${provider}&email=${customerEmail}&currency=${currency}`;

      // Create result card
      const resultCard = document.createElement("div");
      resultCard.className = "card mb-4 result-card";
      resultCard.innerHTML = `
        <div class="card-header bg-success text-white">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="mb-0"><i class="fas fa-check-circle me-2"></i>Payment Link Generated Successfully</h5>
            <div class="actions">
              <button type="button" class="btn btn-sm btn-light ms-2" id="share-payment-link">
                <i class="fas fa-share-alt"></i>
              </button>
            </div>
          </div>
        </div>
        <div class="card-body">
          <div class="mb-4">
            <label class="form-label fw-bold">Payment Link:</label>
            <div class="position-relative">
              <div class="copy-link-container">
                <input type="text" class="copy-link-input" value="${paymentLink}" readonly>
                <button class="copy-link-button" id="copy-payment-link">
                  <i class="fas fa-copy"></i>
                  <span class="copy-feedback">Copied!</span>
                </button>
              </div>
            </div>
            <small class="text-muted">Send this link to your customer to process the payment</small>
          </div>
          
          <div class="mb-3">
            <label class="form-label fw-bold">Tracking Number:</label>
            <div class="position-relative">
              <div class="copy-link-container">
                <input type="text" class="copy-link-input" value="${addressIn}" readonly>
                <button class="copy-link-button" id="copy-tracking-number">
                  <i class="fas fa-copy"></i>
                  <span class="copy-feedback">Copied!</span>
                </button>
              </div>
            </div>
            <small class="text-muted">Use this number to track your payment</small>
          </div>

          <div class="alert alert-info mt-4">
            <div class="d-flex">
              <div class="me-3">
                <i class="fas fa-info-circle fs-4"></i>
              </div>
              <div>
                <h6 class="mb-1">What happens next?</h6>
                <p class="mb-0">Funds will be automatically transferred to your wallet once the payment is completed. The transaction typically takes 2-5 minutes to be confirmed on the blockchain.</p>
              </div>
            </div>
          </div>
        </div>
      `;

      // Add the result to the DOM
      paymentResult.innerHTML = "";
      paymentResult.appendChild(resultCard);
      paymentResult.classList.add("show");

      // Add copy event listeners
      document
        .getElementById("copy-payment-link")
        .addEventListener("click", function () {
          copyToClipboard(paymentLink, this);
        });

      document
        .getElementById("copy-tracking-number")
        .addEventListener("click", function () {
          copyToClipboard(addressIn, this);
        });

      // Add share functionality
      document
        .getElementById("share-payment-link")
        .addEventListener("click", function () {
          sharePaymentLink(paymentLink);
        });

      // Scroll to the result
      setTimeout(() => {
        resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);

      // Show success toast
      showToast("Payment link generated successfully", "success");
    } else {
      showValidationError(
        "Invalid payment wallet. Please enter a valid USDC (Polygon) wallet address."
      );
    }
  } catch (error) {
    console.error("Error:", error);
    showValidationError(
      `An error occurred while processing your request: ${error.message}`
    );
  } finally {
    stopLoading();
  }
});

// Add tooltips to provider options
const providerInputs = document.querySelectorAll('input[name="provider"]');
providerInputs.forEach((input) => {
  const providerId = input.value;
  const minAmount = minAmounts[providerId] || "N/A";

  const tooltip = `Minimum amount: ${minAmount}`;
  input.parentElement.setAttribute("title", tooltip);
  input.parentElement.setAttribute("data-bs-toggle", "tooltip");
  input.parentElement.setAttribute("data-bs-placement", "top");
});

// Update currency restrictions when changing provider
document.querySelectorAll('input[name="provider"]').forEach((input) => {
  input.addEventListener("change", function () {
    const provider = this.value;
    const currencySelect = document.getElementById("currency");

    // Check provider and currency compatibility
    if (
      provider === "wert" ||
      provider === "stripe" ||
      provider === "transfi" ||
      provider === "robinhood" ||
      provider === "rampnetwork"
    ) {
      if (currencySelect.value !== "USD") {
        currencySelect.value = "USD";
        showToast("This provider only accepts USD as currency", "warning");
      }
    } else if (provider === "werteur") {
      if (currencySelect.value !== "EUR") {
        currencySelect.value = "EUR";
        showToast("This provider only accepts EUR as currency", "warning");
      }
    } else if (provider === "upi") {
      if (currencySelect.value !== "INR") {
        currencySelect.value = "INR";
        showToast("This provider only accepts INR as currency", "warning");
      }
    } else if (provider === "interac") {
      if (currencySelect.value !== "CAD") {
        currencySelect.value = "CAD";
        showToast("This provider only accepts CAD as currency", "warning");
      }
    }

    // Update minimum amount information
    const minAmount = minAmounts[provider] || 0;
    const amountInput = document.getElementById("amount");
    amountInput.setAttribute("min", minAmount);
    amountInput.setAttribute("placeholder", `Min: ${minAmount}`);

    // Highlight the selected provider card
    document.querySelectorAll(".provider-card").forEach((card) => {
      card.classList.remove("selected");
    });
    this.closest(".provider-card").classList.add("selected");
  });
});

// Function to show toast messages
function showToast(message, type = "info") {
  const toastContainer = document.querySelector(".toast-container");

  const toastElement = document.createElement("div");
  toastElement.className = `toast align-items-center text-white bg-${type} border-0`;
  toastElement.setAttribute("role", "alert");
  toastElement.setAttribute("aria-live", "assertive");
  toastElement.setAttribute("aria-atomic", "true");

  const iconClass =
    type === "info"
      ? "info-circle"
      : type === "warning"
      ? "exclamation-triangle"
      : type === "success"
      ? "check-circle"
      : "exclamation-circle";

  toastElement.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="fas fa-${iconClass} me-2"></i>
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  toastContainer.appendChild(toastElement);

  // Initialize and show the toast
  const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
  toast.show();

  // Remove after closing
  toastElement.addEventListener("hidden.bs.toast", () => {
    toastElement.remove();
  });
}

// Validate amount when changing value
document.getElementById("amount").addEventListener("change", function () {
  const value = parseFloat(this.value);
  const provider = document.querySelector(
    'input[name="provider"]:checked'
  ).value;
  const minValue = minAmounts[provider] || 0;

  if (value < minValue) {
    this.setCustomValidity(`Minimum amount for ${provider} is ${minValue}`);
    showToast(`Minimum amount for ${provider} is ${minValue}`, "warning");
  } else {
    this.setCustomValidity("");
  }
});

// Update validation rules when changing currency
document.getElementById("currency").addEventListener("change", function () {
  const currency = this.value;
  const provider = document.querySelector(
    'input[name="provider"]:checked'
  ).value;

  // Check compatibility
  let isCompatible = true;
  let errorMessage = "";

  if (
    currency !== "USD" &&
    (provider === "wert" ||
      provider === "stripe" ||
      provider === "transfi" ||
      provider === "robinhood" ||
      provider === "rampnetwork")
  ) {
    isCompatible = false;
    errorMessage = `${provider} only supports USD payments`;
  } else if (currency !== "INR" && provider === "upi") {
    isCompatible = false;
    errorMessage = `${provider} only supports INR payments`;
  } else if (currency !== "CAD" && provider === "interac") {
    isCompatible = false;
    errorMessage = `${provider} only supports CAD payments`;
  } else if (currency !== "EUR" && provider === "werteur") {
    isCompatible = false;
    errorMessage = `${provider} only supports EUR payments`;
  }

  if (!isCompatible) {
    showToast(errorMessage, "warning");

    // Suggest a compatible provider
    let suggestedProvider = "";
    if (currency === "USD") {
      suggestedProvider = "wert";
    } else if (currency === "EUR") {
      suggestedProvider = "werteur";
    } else if (currency === "INR") {
      suggestedProvider = "upi";
    } else if (currency === "CAD") {
      suggestedProvider = "interac";
    }

    if (suggestedProvider) {
      document.getElementById(`provider-${suggestedProvider}`).checked = true;

      // Trigger the change event manually
      const event = new Event("change");
      document
        .getElementById(`provider-${suggestedProvider}`)
        .dispatchEvent(event);

      showToast(`Provider changed to ${suggestedProvider}`, "info");
    }
  }

  // Update the currency filter button as active
  document.querySelectorAll(".provider-filter button").forEach((btn) => {
    btn.classList.remove("active");
    if (
      btn.getAttribute("data-filter") === currency.toLowerCase() ||
      btn.getAttribute("data-filter") === "all"
    ) {
      btn.classList.add("active");
    }
  });
});

// Validate wallet address in real-time
document
  .getElementById("wallet_address")
  .addEventListener("input", function () {
    const walletAddress = this.value.trim();
    const walletRegex = /^0x[a-fA-F0-9]{40}$/;

    if (walletAddress && !walletRegex.test(walletAddress)) {
      this.classList.add("is-invalid");
      this.setCustomValidity("Invalid wallet address");
    } else {
      this.classList.remove("is-invalid");
      this.setCustomValidity("");
    }
  });

// Native share support
function sharePaymentLink(url) {
  if (navigator.share) {
    navigator
      .share({
        title: "Transact Payment Link",
        text: "Use this link to make a payment:",
        url: url,
      })
      .then(() => showToast("Link shared successfully", "success"))
      .catch((error) => console.log("Error sharing:", error));
  } else {
    copyToClipboard(url, document.getElementById("copy-payment-link"));
    showToast("Link copied to clipboard", "success");
  }
}

// Initialize tooltips
document.addEventListener("DOMContentLoaded", function () {
  // Initialize Bootstrap tooltips
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Set initial minimum amount info
  const initialProvider = document.querySelector(
    'input[name="provider"]:checked'
  ).value;
  const amountInput = document.getElementById("amount");
  amountInput.setAttribute("min", minAmounts[initialProvider]);
  amountInput.setAttribute(
    "placeholder",
    `Min: ${minAmounts[initialProvider]}`
  );

  // Add selected class to the initial provider
  const selectedProviderCard = document
    .querySelector('input[name="provider"]:checked')
    .closest(".provider-card");
  selectedProviderCard.classList.add("selected");

  // Adjust interface for mobile
  if (window.innerWidth < 768) {
    document.querySelector(".provider-group").style.maxHeight = "200px";
  }

  // Allow the entire provider card to be clickable
  document.querySelectorAll(".provider-card").forEach(function (card) {
    card.addEventListener("click", function (e) {
      // Avoid double click when clicking on the input itself
      if (e.target.tagName !== "INPUT") {
        // Find the input within this card and mark it as selected
        const input = this.querySelector('input[type="radio"]');
        if (input) {
          input.checked = true;

          // Trigger change event to update the UI
          const changeEvent = new Event("change");
          input.dispatchEvent(changeEvent);

          // Remove selected class from all cards
          document.querySelectorAll(".provider-card").forEach((c) => {
            c.classList.remove("selected");
          });

          // Add selected class to the current card
          this.classList.add("selected");
        }
      }
    });
  });
});
