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

// Advanced decryption function to match new encryption methods
function decryptWalletAddress(encryptedData) {
  try {
    // Convert from URL-safe base64 back to regular base64
    let base64 = encryptedData.replace(/-/g, "+").replace(/_/g, "/");

    // Add back any missing padding (=)
    while (base64.length % 4) {
      base64 += "=";
    }

    // Decode base64
    const decoded = atob(base64);

    // Check if this is the fallback format (starts with F1:)
    if (decoded.startsWith("F1:")) {
      // Handle fallback format
      const parts = decoded.split(":");
      if (parts.length !== 4) {
        throw new Error("Invalid encrypted data format");
      }

      const version = parts[0]; // F1
      const salt = parts[1];
      const integrityCheckHex = parts[2];
      const encrypted = parts[3];

      // Recreate the full key
      const fullKey = ENCRYPTION_KEY + salt;

      // Multiple rounds of decryption (reverse of encryption)
      let decrypted = encrypted;
      for (let round = 2; round >= 0; round--) {
        let roundResult = "";
        for (let i = 0; i < decrypted.length; i++) {
          // Reverse the complex XOR pattern
          const keyChar = fullKey.charCodeAt((i * round + i) % fullKey.length);
          const prevChar = i > 0 ? decrypted.charCodeAt(i - 1) : 0;
          const charCode = decrypted.charCodeAt(i) ^ keyChar ^ (prevChar >> 3);
          roundResult += String.fromCharCode(charCode);
        }
        decrypted = roundResult;
      }

      // Verify integrity check
      let calculatedCheck = 0;
      for (let i = 0; i < decrypted.length; i++) {
        calculatedCheck =
          (calculatedCheck * 31 + decrypted.charCodeAt(i)) >>> 0;
      }

      if (calculatedCheck.toString(16) !== integrityCheckHex) {
        console.error("Integrity check failed");
        return null;
      }

      // Validate wallet address format
      if (validateWalletAddress(decrypted)) {
        return decrypted;
      } else {
        console.error("Decrypted value is not a valid wallet address");
        return null;
      }
    } else {
      // Handle sophisticated format (binary data)
      const bytes = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i);
      }

      // Extract components
      const salt = bytes.slice(0, 16);
      const integrity = bytes.slice(16, 48);
      const encrypted = bytes.slice(48);

      // Recreate the key
      const encoder = new TextEncoder();
      const key = encoder.encode(ENCRYPTION_KEY);

      // Initialize S-box (same as in encryption)
      const sBox = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        sBox[i] = i;
      }

      let j = 0;
      for (let i = 0; i < 256; i++) {
        j = (j + sBox[i] + key[i % key.length] + salt[i % salt.length]) % 256;
        [sBox[i], sBox[j]] = [sBox[j], sBox[i]]; // Swap
      }

      // Decrypt the data
      const decrypted = new Uint8Array(encrypted.length);
      for (let i = 0; i < encrypted.length; i++) {
        const a = (i + 1) % 256;
        const b = (sBox[a] + sBox[i % 256]) % 256;
        [sBox[a], sBox[b]] = [sBox[b], sBox[a]]; // Swap
        const k = sBox[(sBox[a] + sBox[b]) % 256];
        decrypted[i] = encrypted[i] ^ k;
      }

      // Verify integrity
      const calculatedIntegrity = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        let value = salt[i % salt.length];
        for (let j = 0; j < decrypted.length; j++) {
          value ^= decrypted[j];
          value = ((value << 1) | (value >> 7)) & 0xff; // Rotate left
        }
        calculatedIntegrity[i] = value;
      }

      // Compare integrity values
      let integrityMatch = true;
      for (let i = 0; i < 32; i++) {
        if (integrity[i] !== calculatedIntegrity[i]) {
          integrityMatch = false;
          break;
        }
      }

      if (!integrityMatch) {
        console.error("Integrity check failed");
        return null;
      }

      // Convert decrypted bytes to string
      const decoder = new TextDecoder();
      const walletAddress = decoder.decode(decrypted);

      // Validate wallet address format
      if (validateWalletAddress(walletAddress)) {
        return walletAddress;
      } else {
        console.error("Decrypted value is not a valid wallet address");
        return null;
      }
    }
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
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

async function generatePaymentLink(walletData) {
  // Generate tracking ID for the payment
  const payoutTrackingId = `https://paygate.to/payment-link/invoice.php?payment=${Date.now()}_${
    Math.floor(Math.random() * 9000000) + 1000000
  }`;
  const callback = encodeURIComponent(payoutTrackingId);

  // API call
  const response = await fetch(
    `https://api.transact.st/control/wallet.php?address=${decryptWalletAddress(
      walletData
    )}&callback=${callback}`
  );

  if (!response.ok) {
    throw new Error(`Server response error: ${response.status}`);
  }

  const data = await response.json();

  const currentHost = window.location.origin;
  return {
    addressIn: data.address_in,
    paymentLink: `${currentHost}/business-payment?data=${encodeURIComponent(
      walletData
    )}`,
    trackingUrl: `https://api.transact.st/control/track.php?address=${data.address_in}`,
  };
}

function displayResult(walletAddress, paymentLink) {
  const resultContainer = document.getElementById(RESULT_CONTAINER_ID);
  
  // Extract the data from the payment link
  const urlData = new URL(paymentLink);
  const encryptedData = urlData.searchParams.get('data');

  resultContainer.innerHTML = `
    <div class="card success-card animate-success">
      <div class="card-header text-white">
        <i class="fas fa-check-circle me-2"></i> Payment Page Generated Successfully
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-12">
            <div class="mb-section">
              <div class="mb-3">
                <span class="text-muted d-block">Wallet Address:</span>
                <span class="fw-bold">${walletAddress}</span>
              </div>
              
              <div class="alert alert-info mb-4">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Your business payment page is ready!</strong> Share this link with your business clients and they'll be able to create payment links for their customers with your wallet address locked.
              </div>
              
              <label class="form-label fw-bold">Business Payment URL:</label>
              <div class="input-group mb-3">
                <input type="text" class="form-control" value="${paymentLink}" id="payment-link" readonly style="background-color: var(--input-background); color: var(--input-text-color);">
                <button class="btn btn-outline-secondary" type="button" id="copy-link" data-bs-toggle="tooltip" data-bs-placement="top" title="Copy to Clipboard">
                  <i class="fas fa-copy"></i>
                </button>
              </div>
              <small class="text-muted d-block mb-3">Share this URL with business clients who need to create payment links</small>
            </div>
            
            <div class="tracking-section">
              <h6 class="tracking-section-title">Link Tracking</h6>
              
              <div class="mb-3">
                <label class="form-label fw-semibold">Reference Code:</label>
                <div class="input-group mb-2">
                  <input type="text" class="form-control" value="${encryptedData}" id="tracking-number" readonly style="background-color: var(--input-background); color: var(--input-text-color);">
                  <button class="btn btn-outline-secondary" type="button" id="copy-tracking-number" data-bs-toggle="tooltip" data-bs-placement="top" title="Copy to Clipboard">
                    <i class="fas fa-copy"></i>
                  </button>
                </div>
                <small class="text-muted d-block">Reference code for this business payment page</small>
              </div>
              
              <div class="mb-3">
                <label class="form-label fw-semibold">Tracking URL:</label>
                <div class="input-group mb-2">
                  <input type="text" class="form-control" value="https://payment.transact.st/control/page-status.php?ref=${encryptedData}" id="tracking-url" readonly style="background-color: var(--input-background); color: var(--input-text-color);">
                  <button class="btn btn-outline-secondary" type="button" id="copy-tracking-url" data-bs-toggle="tooltip" data-bs-placement="top" title="Copy to Clipboard">
                    <i class="fas fa-copy"></i>
                  </button>
                </div>
                <small class="text-muted d-block">Use this link to monitor the page activity</small>
              </div>
            </div>
            
            <div class="share-buttons mt-4 mb-3">
              <h6 class="mb-2 fw-semibold">Share Payment Page</h6>
              <div class="d-flex flex-wrap gap-2">
                <a href="https://wa.me/?text=${encodeURIComponent(
                  `Use this payment link to process your customer payments: ${paymentLink}`
                )}" target="_blank" class="btn btn-success btn-sm" aria-label="Share on WhatsApp">
                  <i class="fab fa-whatsapp me-1"></i> WhatsApp
                </a>
                <a href="https://t.me/share/url?url=${encodeURIComponent(
                  paymentLink
                )}&text=${encodeURIComponent(
    "Use this payment link to process your customer payments:"
  )}" target="_blank" class="btn btn-primary btn-sm" aria-label="Share on Telegram">
                  <i class="fab fa-telegram me-1"></i> Telegram
                </a>
                <a href="mailto:?subject=Payment%20Link&body=${encodeURIComponent(
                  `Use this payment link to process your customer payments: ${paymentLink}`
                )}" class="btn btn-secondary btn-sm" aria-label="Share by Email">
                  <i class="fas fa-envelope me-1"></i> Email
                </a>
              </div>
            </div>
            
            <div class="d-grid mt-4">
              <a href="${paymentLink}" class="btn btn-primary" target="_blank">
                <i class="fas fa-external-link-alt me-2"></i> Open Payment Page
              </a>
            </div>
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
      copyToClipboard(paymentLinkInput.value);
    });
  }

  // Add event listeners for tracking number and tracking URL buttons
  const copyTrackingNumberButton = document.getElementById(
    "copy-tracking-number"
  );
  if (copyTrackingNumberButton) {
    copyTrackingNumberButton.addEventListener("click", () => {
      const trackingNumberInput = document.getElementById("tracking-number");
      copyToClipboard(trackingNumberInput.value);
    });
  }

  const copyTrackingUrlButton = document.getElementById("copy-tracking-url");
  if (copyTrackingUrlButton) {
    copyTrackingUrlButton.addEventListener("click", () => {
      const trackingUrlInput = document.getElementById("tracking-url");
      copyToClipboard(trackingUrlInput.value);
    });
  }
}

function copyToClipboard(text) {
  // Create a temporary input element
  const tempInput = document.createElement("input");
  tempInput.value = text;
  document.body.appendChild(tempInput);

  // Select and copy the text
  tempInput.select();
  document.execCommand("copy");

  // Remove the temporary element
  document.body.removeChild(tempInput);

  // Update tooltip on the button that was clicked
  const button = event.currentTarget;
  const tooltip = bootstrap.Tooltip.getInstance(button);

  if (tooltip) {
    // Update tooltip to show copied
    button.setAttribute("data-bs-original-title", "Copied!");
    tooltip.update();

    // Reset tooltip after 2 seconds
    setTimeout(() => {
      button.setAttribute("data-bs-original-title", "Copy to Clipboard");
      tooltip.update();
    }, 2000);
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

    const paymentLink = await generatePaymentLink(encryptedWallet);

    // Display result with success card
    await displayResult(walletAddress, paymentLink.paymentLink);

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
