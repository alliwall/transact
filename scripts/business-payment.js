// Constants
const FORM_ID = "payment-form";
const WALLET_ADDRESS_ID = "wallet_address";
const AMOUNT_ID = "amount";
const CUSTOMER_EMAIL_ID = "customer_email";
const SUBMIT_BUTTON_ID = "submit-btn";
const SUBMIT_TEXT_ID = "submit-text";
const LOADING_SPINNER_ID = "loading-spinner";
const RESULT_CONTAINER_ID = "payment-result";
const TOAST_CONTAINER = ".toast-container";
const MERCHANT_INFO_ID = "merchant-info";
const CURRENCY_ID = "currency";
const ENCRYPTION_KEY = "Transact.st:8a7b6c5d4e3f2g1h"; // Fixed key for AES decryption

// Helper Functions
function validateWalletAddress(address) {
  // Simple validation for Ethereum-style addresses
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function validateAmount(amount) {
  return !isNaN(amount) && amount > 0;
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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
    submitText.textContent = "Processing...";
    loadingSpinner.classList.remove("d-none");
  } else {
    submitButton.disabled = false;
    submitText.textContent = "Generate Payment Link";
    loadingSpinner.classList.add("d-none");
  }
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

async function generatePaymentLink(
  walletAddress,
  amount,
  customerEmail,
  provider,
  currency = "USD"
) {
  // Generate tracking ID for the payment
  const payoutTrackingId = `https://paygate.to/payment-link/invoice.php?payment=${Date.now()}_${
    Math.floor(Math.random() * 9000000) + 1000000
  }`;
  const callback = encodeURIComponent(payoutTrackingId);

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
    const customerEmailEncoded = encodeURIComponent(customerEmail);
    return `https://payment.transact.st/process-payment.php?address=${addressIn}&amount=${amount}&provider=${provider}&email=${customerEmailEncoded}&currency=${currency}`;
  } else {
    console.error("Error generating payment link");
    return null;
  }
}

async function displayResult(
  walletAddress,
  amount,
  email,
  provider,
  paymentLink
) {
  const resultContainer = document.getElementById(RESULT_CONTAINER_ID);

  try {
    const formattedAmount = parseFloat(amount).toFixed(2);

    resultContainer.innerHTML = `
      <div class="card success-card">
        <div class="card-header text-white">
          <i class="fas fa-check-circle me-2"></i> Payment Link Generated Successfully
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-12">
              <p class="mb-2">
                <strong>Amount:</strong> ${formattedAmount} USDC
              </p>
              <p class="mb-2">
                <strong>Customer Email:</strong> ${email}
              </p>
              <p class="mb-3">
                <strong>Payment Provider:</strong> ${provider}
              </p>
              
              <div class="input-group mb-3">
                <input type="text" class="form-control" value="${paymentLink}" id="payment-link" readonly>
                <button class="btn btn-outline-secondary" type="button" id="copy-link" data-bs-toggle="tooltip" data-bs-placement="top" title="Copy to Clipboard">
                  <i class="fas fa-copy"></i>
                </button>
              </div>
              <div class="share-buttons mb-3">
                <a href="https://wa.me/?text=${encodeURIComponent(
                  `Complete your payment of ${formattedAmount} USDC here: ${paymentLink}`
                )}" target="_blank" class="btn btn-success btn-sm" aria-label="Share on WhatsApp">
                  <i class="fab fa-whatsapp"></i> WhatsApp
                </a>
                <a href="https://t.me/share/url?url=${encodeURIComponent(
                  paymentLink
                )}&text=${encodeURIComponent(
      `Complete your payment of ${formattedAmount} USDC here:`
    )}" target="_blank" class="btn btn-primary btn-sm" aria-label="Share on Telegram">
                  <i class="fab fa-telegram"></i> Telegram
                </a>
                <a href="mailto:${email}?subject=Payment%20Link&body=${encodeURIComponent(
      `Complete your payment of ${formattedAmount} USDC here: ${paymentLink}`
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
  } catch (error) {
    console.error("Error displaying result:", error);
    showToast(
      "Erro ao exibir o resultado. Por favor, tente novamente mais tarde.",
      "error"
    );
  }
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
    const amountInput = document.getElementById(AMOUNT_ID);
    const emailInput = document.getElementById(CUSTOMER_EMAIL_ID);
    const currencyInput = document.getElementById(CURRENCY_ID);

    const walletAddress = walletAddressInput.value.trim();
    const amount = parseFloat(amountInput.value.trim());
    const email = emailInput.value.trim();
    const currency = currencyInput.value.trim();

    // Get selected provider
    const providerInput = document.querySelector(
      'input[name="provider"]:checked'
    );
    const provider = providerInput.value;
    const minAmount = parseFloat(providerInput.getAttribute("data-min-amount") || "0");

    // Validate inputs
    if (!validateWalletAddress(walletAddress)) {
      showToast("Invalid wallet address format.", "danger");
      toggleLoading(false);
      return;
    }

    if (!validateAmount(amount)) {
      showToast("Please enter a valid amount greater than zero.", "danger");
      toggleLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      showToast("Please enter a valid email address.", "danger");
      toggleLoading(false);
      return;
    }
    
    // Validate minimum amount
    if (amount < minAmount) {
      showToast(
        `Minimum amount for ${provider} is ${minAmount} ${currency}`,
        "danger"
      );
      toggleLoading(false);
      return;
    }

    // Currency validation removed as it's now automatically set based on provider

    // Generate payment link
    const paymentLink = await generatePaymentLink(
      walletAddress,
      amount,
      email,
      provider,
      currency
    );

    // Display result
    await displayResult(walletAddress, amount, email, provider, paymentLink);

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

// Extract and decrypt wallet address from URL
async function processUrlParams() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const encryptedData = urlParams.get("data");

    if (!encryptedData) {
      showToast(
        "No wallet data provided. Please use a valid payment link.",
        "danger"
      );
      return false;
    }

    // Decrypt the wallet address
    const walletAddress = await decryptWalletAddress(encryptedData);

    if (!walletAddress || !validateWalletAddress(walletAddress)) {
      showToast(
        "Invalid or corrupted wallet data. Please use a valid payment link.",
        "danger"
      );
      return false;
    }

    // Set the wallet address in the form
    const walletInput = document.getElementById(WALLET_ADDRESS_ID);
    walletInput.value = walletAddress;

    // Update merchant info
    const merchantInfo = document.getElementById(MERCHANT_INFO_ID);
    if (merchantInfo) {
      merchantInfo.innerHTML = `<strong>Business Payment:</strong> You are creating a payment link that will send funds to the business wallet address shown below. This address is locked and cannot be changed.`;
    }

    return true;
  } catch (error) {
    console.error("Error processing URL parameters:", error);
    showToast(
      "Error processing the payment link. Please try again with a valid link.",
      "danger"
    );
    return false;
  }
}

// Script initialization
document.addEventListener("DOMContentLoaded", async function () {
  // Process URL parameters first
  const validWallet = await processUrlParams();

  if (!validWallet) {
    // Disable form if the wallet is invalid
    const form = document.getElementById(FORM_ID);
    if (form) {
      form
        .querySelectorAll("input, button")
        .forEach((el) => (el.disabled = true));
    }
    return;
  }

  // Add form submission handler
  const form = document.getElementById(FORM_ID);
  if (form) {
    form.addEventListener("submit", handleFormSubmission);
  }

  // Add tooltips to provider options
  const providerInputs = document.querySelectorAll('input[name="provider"]');
  providerInputs.forEach((input) => {
    const minAmount = input.getAttribute("data-min-amount") || "N/A";
    const supportedCurrency = input.getAttribute("data-supported-currency") || "ALL";

    const tooltip = `Minimum amount: ${minAmount}${supportedCurrency !== "ALL" ? ` (${supportedCurrency} only)` : ""}`;
    input.parentElement.setAttribute("title", tooltip);
    input.parentElement.setAttribute("data-bs-toggle", "tooltip");
    input.parentElement.setAttribute("data-bs-placement", "top");
  });

  // Update minimum amount when provider changes
  document.querySelectorAll('input[name="provider"]').forEach((input) => {
    input.addEventListener("change", function () {
      const minAmount = parseFloat(this.getAttribute("data-min-amount") || "0");
      const supportedCurrency = this.getAttribute("data-supported-currency");
      const amountInput = document.getElementById(AMOUNT_ID);
      
      amountInput.setAttribute("min", minAmount);
      
      // Set currency based on provider
      const currencyInput = document.getElementById(CURRENCY_ID);
      if (supportedCurrency !== "ALL") {
        currencyInput.value = supportedCurrency;
      } else {
        currencyInput.value = "USD"; // Default to USD for providers that support all currencies
      }
    });
  });
  
  // Remove currency change listener as we no longer have a select

  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Show all providers regardless of currency
  document.querySelectorAll(".provider-item").forEach((item) => {
    item.style.display = "block";
  });
  
  // Add provider search functionality
  const providerSearch = document.getElementById("provider-search");
  if (providerSearch) {
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
