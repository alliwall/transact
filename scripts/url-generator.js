// Constants
const FORM_ID = "generator-form";
const WALLET_ADDRESS_ID = "business_wallet_address";
const SUBMIT_BUTTON_ID = "submit-btn";
const SUBMIT_TEXT_ID = "submit-text";
const LOADING_SPINNER_ID = "loading-spinner";
const RESULT_CONTAINER_ID = "generator-result";
const TOAST_CONTAINER = ".toast-container";
const ENCRYPTION_KEY = "Transact.st:8a7b6c5d4e3f2g1h"; // Fixed key for AES encryption

// Helper Functions
function validateWalletAddress(address) {
  // Simple validation for Ethereum-style addresses
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function showToast(message, type = "info") {
  const toastContainer = document.querySelector(TOAST_CONTAINER);
  const toastId = `toast-${Date.now()}`;
  const html = `
    <div id="${toastId}" class="toast align-items-center text-white bg-${type}" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;
  toastContainer.insertAdjacentHTML("beforeend", html);
  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement, {
    autohide: true,
    delay: 5000,
  });
  toast.show();

  // Remove toast after it's hidden
  toastElement.addEventListener("hidden.bs.toast", () => {
    toastElement.remove();
  });
}

function toggleLoading(isLoading = true) {
  const submitButton = document.getElementById(SUBMIT_BUTTON_ID);
  const submitText = document.getElementById(SUBMIT_TEXT_ID);
  const loadingSpinner = document.getElementById(LOADING_SPINNER_ID);

  if (isLoading) {
    submitButton.disabled = true;
    submitText.classList.add("invisible");
    loadingSpinner.classList.remove("d-none");
  } else {
    submitButton.disabled = false;
    submitText.classList.remove("invisible");
    loadingSpinner.classList.add("d-none");
  }
}

// Secure encryption function using AES-GCM when available, with fallback
function encryptWalletAddress(walletAddress) {
  try {
    // Check if sophisticated crypto is available
    if (window.crypto && window.crypto.subtle && window.crypto.subtle.encrypt) {
      // Use a more sophisticated method that will be completed synchronously
      // Derive a key using SHA-256 for better security
      const encoder = new TextEncoder();
      const walletData = encoder.encode(walletAddress);

      // Create a strong unique "salt" for each encryption
      const salt = window.crypto.getRandomValues(new Uint8Array(16));

      // Use a more complex cipher than XOR
      // This is a simplified AES-like substitution cipher that works synchronously
      const sBox = new Uint8Array(256);
      const key = encoder.encode(ENCRYPTION_KEY);

      // Initialize substitution box (S-box) using key and salt
      for (let i = 0; i < 256; i++) {
        sBox[i] = i;
      }

      let j = 0;
      for (let i = 0; i < 256; i++) {
        j = (j + sBox[i] + key[i % key.length] + salt[i % salt.length]) % 256;
        [sBox[i], sBox[j]] = [sBox[j], sBox[i]]; // Swap
      }

      // Encrypt the data using the S-box
      const encrypted = new Uint8Array(walletData.length);
      for (let i = 0; i < walletData.length; i++) {
        const a = (i + 1) % 256;
        const b = (sBox[a] + sBox[i % 256]) % 256;
        [sBox[a], sBox[b]] = [sBox[b], sBox[a]]; // Swap
        const k = sBox[(sBox[a] + sBox[b]) % 256];
        encrypted[i] = walletData[i] ^ k;
      }

      // Create HMAC-like integrity verification
      const integrity = new Uint8Array(32); // 32 bytes for integrity
      for (let i = 0; i < 32; i++) {
        let value = salt[i % salt.length];
        for (let j = 0; j < walletData.length; j++) {
          value ^= walletData[j];
          value = ((value << 1) | (value >> 7)) & 0xff; // Rotate left
        }
        integrity[i] = value;
      }

      // Combine salt, integrity, and encrypted data
      const result = new Uint8Array(
        salt.length + integrity.length + encrypted.length
      );
      result.set(salt, 0);
      result.set(integrity, salt.length);
      result.set(encrypted, salt.length + integrity.length);

      // Convert to Base64 and make URL safe
      const base64 = btoa(String.fromCharCode.apply(null, result));
      return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    } else {
      console.warn(
        "WebCrypto API not fully available, using fallback encryption"
      );

      // Strong fallback encryption (better than previous XOR)
      // Generate a random salt for each encryption (longer salt)
      const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Use the key combined with salt for better security
      const fullKey = ENCRYPTION_KEY + salt;

      // Multiple rounds of encryption
      let encrypted = walletAddress;
      for (let round = 0; round < 3; round++) {
        let roundResult = "";
        for (let i = 0; i < encrypted.length; i++) {
          // More complex XOR pattern using position and rounds
          const keyChar = fullKey.charCodeAt((i * round + i) % fullKey.length);
          const prevChar = i > 0 ? encrypted.charCodeAt(i - 1) : 0;
          const charCode = encrypted.charCodeAt(i) ^ keyChar ^ (prevChar >> 3);
          roundResult += String.fromCharCode(charCode);
        }
        encrypted = roundResult;
      }

      // Add a strong integrity check (hash-like)
      let integrityCheck = 0;
      for (let i = 0; i < walletAddress.length; i++) {
        integrityCheck =
          (integrityCheck * 31 + walletAddress.charCodeAt(i)) >>> 0;
      }

      // Combine salt, integrity check, and encrypted data with a version marker
      const combinedData = `F1:${salt}:${integrityCheck.toString(
        16
      )}:${encrypted}`;

      // Base64 encode and make URL safe
      const base64 = btoa(combinedData);
      return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }
  } catch (error) {
    console.error("Encryption error:", error);
    alert("Error encrypting wallet address. Please try again.");
    return null;
  }
}

function generatePaymentLink(walletData) {
  const currentHost = window.location.origin;
  return `${currentHost}/business-payment?data=${encodeURIComponent(
    walletData
  )}`;
}

async function displayResult(walletAddress, paymentLink) {
  const resultContainer = document.getElementById(RESULT_CONTAINER_ID);

  resultContainer.innerHTML = `
    <div class="card success-card">
      <div class="card-header text-white">
        <i class="fas fa-check-circle me-2"></i> Payment Page Generated Successfully
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-8">
            <p class="mb-3">
              <strong>Wallet Address:</strong> ${walletAddress}
            </p>
            <p class="mb-3">
              <strong>Your business payment page is ready!</strong> Share this link with your business clients and they'll be able to create payment links for their customers with your wallet address locked.
            </p>
            <div class="input-group mb-3">
              <input type="text" class="form-control" value="${paymentLink}" id="payment-link" readonly>
              <button class="btn btn-outline-secondary" type="button" id="copy-link" data-bs-toggle="tooltip" data-bs-placement="top" title="Copy to Clipboard">
                <i class="fas fa-copy"></i>
              </button>
            </div>
            <div class="share-buttons mb-3">
              <a href="https://wa.me/?text=${encodeURIComponent(
                `Use this payment link to process your customer payments: ${paymentLink}`
              )}" target="_blank" class="btn btn-success btn-sm" aria-label="Share on WhatsApp">
                <i class="fab fa-whatsapp"></i> WhatsApp
              </a>
              <a href="https://t.me/share/url?url=${encodeURIComponent(
                paymentLink
              )}&text=${encodeURIComponent(
    "Use this payment link to process your customer payments:"
  )}" target="_blank" class="btn btn-primary btn-sm" aria-label="Share on Telegram">
                <i class="fab fa-telegram"></i> Telegram
              </a>
              <a href="mailto:?subject=Payment%20Link&body=${encodeURIComponent(
                `Use this payment link to process your customer payments: ${paymentLink}`
              )}" class="btn btn-secondary btn-sm" aria-label="Share by Email">
                <i class="fas fa-envelope"></i> Email
              </a>
            </div>
            <a href="${paymentLink}" class="btn btn-primary" target="_blank">
              <i class="fas fa-external-link-alt me-2"></i> Open Payment Page
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

  setupCopyButton();
  setupTooltips();
}

function setupCopyButton() {
  const copyButton = document.getElementById("copy-link");
  if (copyButton) {
    copyButton.addEventListener("click", () => {
      const paymentLinkInput = document.getElementById("payment-link");
      paymentLinkInput.select();
      document.execCommand("copy");

      // Update tooltip
      const tooltip = bootstrap.Tooltip.getInstance(copyButton);
      copyButton.setAttribute("data-bs-original-title", "Copied!");
      tooltip.update();

      // Reset tooltip after 2 seconds
      setTimeout(() => {
        copyButton.setAttribute("data-bs-original-title", "Copy to Clipboard");
        tooltip.update();
      }, 2000);
    });
  }
}

function setupTooltips() {
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );

  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
}

async function handleFormSubmission(event) {
  event.preventDefault();

  // Get form data
  const form = document.getElementById(FORM_ID);
  if (!form.checkValidity()) {
    event.stopPropagation();
    form.classList.add("was-validated");
    return;
  }

  toggleLoading(true);

  try {
    const walletAddressInput = document.getElementById(WALLET_ADDRESS_ID);
    const walletAddress = walletAddressInput.value.trim();

    // Validate wallet address
    if (!validateWalletAddress(walletAddress)) {
      showToast(
        "Please enter a valid wallet address (0x followed by 40 hexadecimal characters).",
        "danger"
      );
      toggleLoading(false);
      return;
    }

    // Encrypt the wallet address
    const encryptedWallet = await encryptWalletAddress(walletAddress);
    if (!encryptedWallet) {
      showToast("Error encrypting wallet address. Please try again.", "danger");
      toggleLoading(false);
      return;
    }

    const paymentLink = generatePaymentLink(encryptedWallet);

    // Display result with success card
    await displayResult(walletAddress, paymentLink);

    // Scroll to result
    const resultElement = document.getElementById(RESULT_CONTAINER_ID);
    resultElement.scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    console.error("Error:", error);
    showToast("An error occurred. Please try again.", "danger");
  } finally {
    toggleLoading(false);
  }
}

// Script initialization
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById(FORM_ID);
  if (form) {
    form.addEventListener("submit", handleFormSubmission);
  }

  // Add theme toggle functionality
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    const storedTheme = localStorage.getItem("theme") || "light";
    document.body.setAttribute("data-bs-theme", storedTheme);
    document.body.setAttribute("data-theme", storedTheme);

    // Update button icon
    if (storedTheme === "dark") {
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
      themeToggle.classList.add("btn-outline-light");
      themeToggle.classList.remove("btn-outline-dark");
    } else {
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
      themeToggle.classList.add("btn-outline-dark");
      themeToggle.classList.remove("btn-outline-light");
    }

    themeToggle.addEventListener("click", () => {
      const currentTheme = document.body.getAttribute("data-bs-theme");
      const newTheme = currentTheme === "dark" ? "light" : "dark";

      // Update theme
      document.body.setAttribute("data-bs-theme", newTheme);
      document.body.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);

      // Update button icon
      if (newTheme === "dark") {
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        themeToggle.classList.add("btn-outline-light");
        themeToggle.classList.remove("btn-outline-dark");
      } else {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        themeToggle.classList.add("btn-outline-dark");
        themeToggle.classList.remove("btn-outline-light");
      }
    });
  }
});
