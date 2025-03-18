const FORM_ID = "payment-form",
  WALLET_ADDRESS_ID = "wallet_address",
  AMOUNT_ID = "amount",
  CUSTOMER_EMAIL_ID = "customer_email",
  SUBMIT_BUTTON_ID = "submit-btn",
  SUBMIT_TEXT_ID = "submit-text",
  LOADING_SPINNER_ID = "loading-spinner",
  RESULT_CONTAINER_ID = "payment-result",
  TOAST_CONTAINER = ".toast-container",
  MERCHANT_INFO_ID = "merchant-info",
  CURRENCY_ID = "currency",
  ENCRYPTION_KEY = "Transact.st:8a7b6c5d4e3f2g1h",
  minAmounts = {
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
function validateWalletAddress(e) {
  return /^0x[a-fA-F0-9]{40}$/.test(e);
}
function validateAmount(e) {
  return !isNaN(e) && e > 0;
}
function validateEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
function showToast(e, t = "info") {
  let a = document.querySelector(".toast-container"),
    r = document.createElement("div");
  (r.className = `toast align-items-center text-white bg-${t} border-0`),
    r.setAttribute("role", "alert"),
    r.setAttribute("aria-live", "assertive"),
    r.setAttribute("aria-atomic", "true"),
    (r.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="fas fa-${
          "info" === t
            ? "info-circle"
            : "warning" === t
            ? "exclamation-triangle"
            : "success" === t
            ? "check-circle"
            : "exclamation-circle"
        } me-2"></i>
        ${e}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `),
    a.appendChild(r);
  new bootstrap.Toast(r, { delay: 3e3 }).show(),
    r.addEventListener("hidden.bs.toast", () => {
      r.remove();
    });
}
function toggleLoading(e = !0) {
  let t = document.getElementById("submit-btn"),
    a = document.getElementById("submit-text"),
    r = document.getElementById("loading-spinner");
  e
    ? ((t.disabled = !0),
      (a.textContent = "Processing..."),
      r.classList.remove("d-none"))
    : ((t.disabled = !1),
      (a.textContent = "Generate Payment Link"),
      r.classList.add("d-none"));
}
function copyToClipboard(e) {
  let t = document.createElement("input");
  (t.value = e),
    document.body.appendChild(t),
    t.select(),
    document.execCommand("copy"),
    document.body.removeChild(t);
  let a = event.currentTarget,
    r = bootstrap.Tooltip.getInstance(a);
  r &&
    (a.setAttribute("data-bs-original-title", "Copied!"),
    r.update(),
    setTimeout(() => {
      a.setAttribute("data-bs-original-title", "Copy to Clipboard"), r.update();
    }, 2e3));
}
async function fetchExternalApi(e, t = {}) {
  try {
    let a = { ...t, credentials: "omit" },
      r = await fetch(e, a);
    if (!r.ok) throw Error(`API request failed with status: ${r.status}`);
    return r;
  } catch (l) {
    throw (console.error("External API fetch error:", l), l);
  }
}
function decryptWalletAddress(e) {
  try {
    let t = e.replace(/-/g, "+").replace(/_/g, "/");
    for (; t.length % 4; ) t += "=";
    let a = atob(t);
    if (a.startsWith("F1:")) {
      let r = a.split(":");
      if (4 !== r.length) throw Error("Invalid encrypted data format");
      let l = r[1],
        n = r[2],
        s = r[3],
        i = ENCRYPTION_KEY + l,
        o = s;
      for (let c = 2; c >= 0; c--) {
        let d = "";
        for (let u = 0; u < o.length; u++) {
          let m = i.charCodeAt((u * c + u) % i.length),
            p = u > 0 ? o.charCodeAt(u - 1) : 0,
            y = o.charCodeAt(u) ^ m ^ (p >> 3);
          d += String.fromCharCode(y);
        }
        o = d;
      }
      let b = 0;
      for (let h = 0; h < o.length; h++) b = (31 * b + o.charCodeAt(h)) >>> 0;
      if (b.toString(16) !== n)
        return console.error("Integrity check failed"), null;
      if (validateWalletAddress(o)) return o;
      return (
        console.error("Decrypted value is not a valid wallet address"), null
      );
    }
    {
      let g = new Uint8Array(a.length);
      for (let f = 0; f < a.length; f++) g[f] = a.charCodeAt(f);
      let v = g.slice(0, 16),
        E = g.slice(16, 48),
        k = g.slice(48),
        A = new TextEncoder().encode(ENCRYPTION_KEY),
        w = new Uint8Array(256);
      for (let L = 0; L < 256; L++) w[L] = L;
      let I = 0;
      for (let T = 0; T < 256; T++)
        (I = (I + w[T] + A[T % A.length] + v[T % v.length]) % 256),
          ([w[T], w[I]] = [w[I], w[T]]);
      let C = new Uint8Array(k.length);
      for (let S = 0; S < k.length; S++) {
        let $ = (S + 1) % 256,
          x = (w[$] + w[S % 256]) % 256;
        [w[$], w[x]] = [w[x], w[$]];
        let D = w[(w[$] + w[x]) % 256];
        C[S] = k[S] ^ D;
      }
      let _ = new Uint8Array(32);
      for (let B = 0; B < 32; B++) {
        let P = v[B % v.length];
        for (let N = 0; N < C.length; N++)
          (P ^= C[N]), (P = ((P << 1) | (P >> 7)) & 255);
        _[B] = P;
      }
      let R = !0;
      for (let M = 0; M < 32; M++)
        if (E[M] !== _[M]) {
          R = !1;
          break;
        }
      if (!R) return console.error("Integrity check failed"), null;
      let q = new TextDecoder().decode(C);
      if (validateWalletAddress(q)) return q;
      return (
        console.error("Decrypted value is not a valid wallet address"), null
      );
    }
  } catch (U) {
    return console.error("Decryption error:", U), null;
  }
}
async function generatePaymentLink(e, t, a, r, l = "USD") {
  let n = await fetchExternalApi(
    `https://api.transact.st/control/wallet.php?address=${e}&callback=${encodeURIComponent(
      `https://paygate.to/payment-link/invoice.php?payment=${Date.now()}_${
        Math.floor(9e6 * Math.random()) + 1e6
      }`
    )}`
  );
  if (!n.ok) throw Error(`Server response error: ${n.status}`);
  let s = await n.json();
  if (!s || !s.address_in)
    return console.error("Error generating payment link"), null;
  {
    let i = s.address_in;
    // Use the origin of the window to generate relative URLs
    const origin = window.location.origin;
    
    return {
      addressIn: i,
      paymentLink: `${origin}/process-payment?address=${i}&amount=${t}&provider=${r}&email=${encodeURIComponent(
        a
      )}&currency=${l}`,
      trackingUrl: `https://api.transact.st/control/track.php?address=${i}`,
    };
  }
}
async function displayResult(e, t, a, r, l, n, s) {
  let i = document.getElementById(RESULT_CONTAINER_ID);
  try {
    let o = parseFloat(t).toFixed(2),
      c = new URL(l).searchParams.get("currency") || "USDC";
    (i.innerHTML = `
      <div class="card success-card animate-success">
        <div class="card-header text-white">
          <i class="fas fa-check-circle me-2"></i> Payment Link Generated Successfully
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-12">
              <div class="mb-section">
                <div class="d-flex flex-wrap justify-content-between mb-3">
                  <div class="mb-2 me-4">
                    <span class="text-muted d-block">Amount:</span>
                    <span class="fw-bold fs-5">${o} ${c}</span>
                  </div>
                  <div class="mb-2 me-4">
                    <span class="text-muted d-block">Customer Email:</span>
                    <span class="fw-bold">${a}</span>
                  </div>
                  <div class="mb-2">
                    <span class="text-muted d-block">Payment Provider:</span>
                    <span class="fw-bold">${r}</span>
                  </div>
                </div>
                
                <label class="form-label fw-bold">Payment Link:</label>
                <div class="input-group mb-3">
                  <input type="text" class="form-control" value="${l}" id="payment-link" readonly style="background-color: var(--input-background); color: var(--input-text-color);">
                  <button class="btn btn-outline-secondary" type="button" id="copy-link" data-bs-toggle="tooltip" data-bs-placement="top" title="Copy to Clipboard">
                    <i class="fas fa-copy"></i>
                  </button>
                </div>
                <small class="text-muted d-block mb-3">Send this link to your customer to process the payment</small>
              </div>
              
              <div class="tracking-section">
                <h6 class="tracking-section-title">Transaction Tracking</h6>
                
                <div class="mb-3">
                  <label class="form-label fw-semibold">Tracking Number:</label>
                  <div class="input-group mb-2">
                    <input type="text" class="form-control" value="${n}" id="tracking-number" readonly style="background-color: var(--input-background); color: var(--input-text-color);">
                    <button class="btn btn-outline-secondary" type="button" id="copy-tracking-number" data-bs-toggle="tooltip" data-bs-placement="top" title="Copy to Clipboard">
                      <i class="fas fa-copy"></i>
                    </button>
                  </div>
                  <small class="text-muted d-block">Transaction ID for tracking the payment</small>
                </div>
                
                <div class="mb-3">
                  <label class="form-label fw-semibold">Tracking URL:</label>
                  <div class="input-group mb-2">
                    <input type="text" class="form-control" value="${s}" id="tracking-url" readonly style="background-color: var(--input-background); color: var(--input-text-color);">
                    <button class="btn btn-outline-secondary" type="button" id="copy-tracking-url" data-bs-toggle="tooltip" data-bs-placement="top" title="Copy to Clipboard">
                      <i class="fas fa-copy"></i>
                    </button>
                  </div>
                  <small class="text-muted d-block">Share this link to monitor the transaction status</small>
                </div>
              </div>
              
              <div class="share-buttons mt-4 mb-3">
                <h6 class="mb-2 fw-semibold">Share Payment Link</h6>
                <div class="d-flex flex-wrap gap-2">
                  <a href="https://wa.me/?text=${encodeURIComponent(
                    `Complete your payment of ${o} ${c} here: ${l}`
                  )}" target="_blank" class="btn btn-success btn-sm" aria-label="Share on WhatsApp">
                    <i class="fab fa-whatsapp me-1"></i> WhatsApp
                  </a>
                  <a href="https://t.me/share/url?url=${encodeURIComponent(
                    l
                  )}&text=${encodeURIComponent(
      `Complete your payment of ${o} ${c} here:`
    )}" target="_blank" class="btn btn-primary btn-sm" aria-label="Share on Telegram">
                    <i class="fab fa-telegram me-1"></i> Telegram
                  </a>
                  <a href="mailto:${a}?subject=Payment%20Link&body=${encodeURIComponent(
      `Complete your payment of ${o} ${c} here: ${l}`
    )}" class="btn btn-secondary btn-sm" aria-label="Share by Email">
                    <i class="fas fa-envelope me-1"></i> Email
                  </a>
                </div>
              </div>
              
              <div class="alert alert-info mt-4">
                <div class="d-flex">
                  <div class="me-3">
                    <i class="fas fa-info-circle fs-4"></i>
                  </div>
                  <div>
                    <h6 class="mb-1 fw-bold">What happens next?</h6>
                    <p class="mb-0">Funds will be automatically transferred to your wallet once the payment is completed. The transaction typically takes 2-5 minutes to be confirmed on the blockchain.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `),
      setupCopyButton(),
      setupTooltips();
    let d = document.getElementById("copy-link");
    d &&
      d.addEventListener("click", () => {
        copyToClipboard(l);
      });
    let u = document.getElementById("copy-tracking-number");
    u &&
      u.addEventListener("click", () => {
        copyToClipboard(n);
      });
    let m = document.getElementById("copy-tracking-url");
    m &&
      m.addEventListener("click", () => {
        copyToClipboard(s);
      });
    [].slice
      .call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
      .map(function (e) {
        return new bootstrap.Tooltip(e);
      });
  } catch (p) {
    console.error("Error displaying result:", p),
      showToast("Error showing the result. Please try again later.", "error");
  }
}
function setupCopyButton() {
  let e = document.getElementById("copy-link");
  e &&
    e.addEventListener("click", () => {
      document.getElementById("payment-link").select(),
        document.execCommand("copy");
      let t = bootstrap.Tooltip.getInstance(e);
      e.setAttribute("data-bs-original-title", "Copied!"),
        t.update(),
        setTimeout(() => {
          e.setAttribute("data-bs-original-title", "Copy to Clipboard"),
            t.update();
        }, 2e3);
    });
}
function setupTooltips() {
  [].slice
    .call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    .map(function (e) {
      return new bootstrap.Tooltip(e);
    });
}
async function handleFormSubmission(e) {
  e.preventDefault();
  let t = document.getElementById(FORM_ID);
  if (!t.checkValidity()) {
    e.stopPropagation(), t.classList.add("was-validated");
    return;
  }
  toggleLoading(!0);
  try {
    let a = document.getElementById(WALLET_ADDRESS_ID),
      r = document.getElementById("amount"),
      l = document.getElementById("customer_email"),
      n = document.getElementById("currency"),
      s = a.value.trim(),
      i = parseFloat(r.value.trim()),
      o = l.value.trim(),
      c = n.value.trim(),
      d = document.querySelector('input[name="provider"]:checked'),
      u = d.value,
      m = parseFloat(d.getAttribute("data-min-amount") || "0");
    if (!validateWalletAddress(s)) {
      showToast("Invalid wallet address format.", "danger"), toggleLoading(!1);
      return;
    }
    if (!validateAmount(i)) {
      showToast(
        "Please enter a valid amount. Check the minimum amount for the selected provider.",
        "danger"
      ),
        toggleLoading(!1);
      return;
    }
    if (!validateEmail(o)) {
      showToast("Please enter a valid email address.", "danger"),
        toggleLoading(!1);
      return;
    }
    if (i < m) {
      showToast(`Minimum amount for ${u} is ${m} ${c}`, "danger"),
        toggleLoading(!1);
      return;
    }
    let p = await generatePaymentLink(s, i, o, u, c);
    await displayResult(s, i, o, u, p.paymentLink, p.addressIn, p.trackingUrl);
    document
      .getElementById(RESULT_CONTAINER_ID)
      .scrollIntoView({ behavior: "smooth" });
  } catch (y) {
    console.error("Error:", y),
      showToast("An error occurred. Please try again.", "danger");
  } finally {
    toggleLoading(!1);
  }
}
async function processUrlParams() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const encryptedWallet = urlParams.get("waddr");
    const providers = urlParams.get("providers");

    // Process wallet address
    if (!encryptedWallet) {
      console.error("No wallet address provided in URL");
      showToast(
        "No wallet address found in the URL. The merchant needs to generate a valid link.",
        "danger"
      );
      toggleLoading(false);
      return false;
    }

    // Decrypt wallet data (includes address and hideWallet flag)
    const walletData = await decryptData(encryptedWallet);
    if (!walletData || !walletData.address) {
      console.error("Failed to decrypt wallet address");
      showToast(
        "Invalid encrypted wallet address. Please contact the merchant for a valid link.",
        "danger"
      );
      toggleLoading(false);
      return false;
    }

    // Set wallet address in input field
    const walletAddressInput = document.getElementById(WALLET_ADDRESS_ID);
    walletAddressInput.value = walletData.address;

    // Hide wallet address field container if hideWallet is true
    if (walletData.hideWallet === true) {
      const walletAddressContainer = walletAddressInput.closest(".mb-3");
      if (walletAddressContainer) {
        walletAddressContainer.style.display = "none";
      }
    }

    // Do not process providers here, this will be done in initialization
    // to ensure the correct currency is applied first

    // Show "This is a pregenerated link" message
    let merchantInfo = document.getElementById(MERCHANT_INFO_ID);
    
    // Create the element if it doesn't exist
    if (!merchantInfo) {
      merchantInfo = document.createElement("div");
      merchantInfo.id = MERCHANT_INFO_ID;
      merchantInfo.className = "mb-4";
      
      // Insert after the lead paragraph
      const leadParagraph = document.querySelector(".card-body .lead");
      if (leadParagraph && leadParagraph.parentNode) {
        leadParagraph.parentNode.insertBefore(merchantInfo, leadParagraph.nextSibling);
      } else {
        // Fallback: insert at the beginning of the form
        const form = document.getElementById(FORM_ID);
        if (form && form.parentNode) {
          form.parentNode.insertBefore(merchantInfo, form);
        }
      }
    }
    
    // Update the element content
    merchantInfo.innerHTML = `<div class="alert-box info">
            <i class="fas fa-info-circle"></i>
            <span>This is a pregenerated payment link that will send funds to the merchant wallet address${
              walletData.hideWallet ? "" : " shown below"
            }. This address is locked and cannot be changed.</span>
        </div>`;

    return true;
  } catch (error) {
    console.error("Error processing URL parameters:", error);
    showToast(
      "Error processing URL parameters. Please try again or contact the merchant.",
      "danger"
    );
    toggleLoading(false);
    return false;
  }
}
async function filterProvidersByCurrency(currency) {
  console.log("Filtering providers by currency:", currency);
  
  const providerItems = document.querySelectorAll(".provider-item");
  let foundChecked = false;

  // Reset - hide all providers first
  providerItems.forEach((item) => {
    item.style.display = "none";
    const input = item.querySelector('input[name="provider"]');
    if (input) {
      input.checked = false;
    }
  });

  // Show only providers compatible with the selected currency
  providerItems.forEach((item) => {
    const providerInput = item.querySelector('input[name="provider"]');
    if (!providerInput) return;
    
    // Check if the provider supports the selected currency
    const dataCurrency = item.getAttribute("data-currency");
    const supportedCurrency = providerInput.getAttribute("data-supported-currency") || "ALL";
    
    const supportsCurrency = 
      (dataCurrency && (dataCurrency.toLowerCase() === currency.toLowerCase() || dataCurrency.toLowerCase() === "all")) ||
      (supportedCurrency === "ALL" || supportedCurrency === currency);
    
    if (supportsCurrency) {
      // Show the provider
      item.style.display = "block";
      providerInput.disabled = false;
      
      // Select the first visible provider
      if (!foundChecked) {
        providerInput.checked = true;
        foundChecked = true;
        
        // Update the minimum value
        updateMinimumAmount(providerInput.value);
        
        // Highlight the selected card
        const card = providerInput.closest(".provider-card");
        if (card) {
          document.querySelectorAll(".provider-card").forEach(c => c.classList.remove("selected"));
          card.classList.add("selected");
        }
      }
    }
  });

  // If no provider was selected, make one last effort
  if (!foundChecked) {
    const firstVisibleProvider = document.querySelector(
      '.provider-item[style="display: block"] input[name="provider"]'
    );
    if (firstVisibleProvider) {
      firstVisibleProvider.checked = true;
      firstVisibleProvider.disabled = false;
      
      // Update the minimum value
      updateMinimumAmount(firstVisibleProvider.value);
      
      // Highlight the card
      const card = firstVisibleProvider.closest(".provider-card");
      if (card) {
        document.querySelectorAll(".provider-card").forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
      }
    } else {
      console.warn("No providers available for the currency " + currency);
    }
  }

  // Ensure all visible providers are enabled
  document.querySelectorAll('.provider-item[style="display: block"] input[name="provider"]')
    .forEach(input => {
      input.disabled = false;
    });

  return foundChecked;
}

// Filter providers by list and currency
async function filterProvidersByList(providersList, currency) {
  console.log("Filtering providers by list:", providersList, "and currency:", currency);
  
  const providerItems = document.querySelectorAll(".provider-item");
  let foundChecked = false;
  let anyProviderVisible = false;
  
  // Hide all providers first
  providerItems.forEach((item) => {
    const providerInput = item.querySelector('input[name="provider"]');
    if (providerInput) {
      const providerValue = providerInput.value;
      
      // Check if it's in the list and supports the currency
      const isInList = providersList.includes(providerValue);
      const supportedCurrency = providerInput.getAttribute("data-supported-currency") || "ALL";
      const supportsCurrency = supportedCurrency === "ALL" || supportedCurrency === currency;
      
      // Show only if it's in the list and supports the currency
      if (isInList && supportsCurrency) {
        item.style.display = "block";
        anyProviderVisible = true;
        
        // Select the first visible provider
        if (!foundChecked) {
          providerInput.checked = true;
          foundChecked = true;
          
          // Update the minimum value
          updateMinimumAmount(providerValue);
          
          // Highlight the selected card
          const card = providerInput.closest(".provider-card");
          if (card) {
            document.querySelectorAll(".provider-card").forEach(c => 
              c.classList.remove("selected")
            );
            card.classList.add("selected");
          }
        }
      } else {
        item.style.display = "none";
        providerInput.checked = false;
      }
    }
  });
  
  // Show message that providers were limited
  const infoElement = document.getElementById("providers-info");
  if (infoElement) {
    infoElement.classList.remove("d-none");
    
    // If no compatible providers found, show a message
    if (!anyProviderVisible) {
      const providerSection = document.querySelector(".provider-section");
      if (providerSection) {
        // If no compatible providers found, create or update an info message
        let noProvidersMsg = document.getElementById("no-providers-message");
        if (!noProvidersMsg) {
          noProvidersMsg = document.createElement("div");
          noProvidersMsg.id = "no-providers-message";
          noProvidersMsg.className = "alert alert-warning mt-3";
          providerSection.appendChild(noProvidersMsg);
        }
        
        noProvidersMsg.innerHTML = `
          <i class="fas fa-exclamation-circle me-2"></i>
          <span>No payment providers available for ${currency}. The merchant has selected providers that don't support this currency.</span>
        `;
        noProvidersMsg.style.display = "block";
      }
      
      // Disable the form submission
      const submitBtn = document.getElementById(SUBMIT_BUTTON_ID);
      if (submitBtn) {
        submitBtn.disabled = true;
      }
    } else {
      // If providers are found, hide the message if it exists
      const noProvidersMsg = document.getElementById("no-providers-message");
      if (noProvidersMsg) {
        noProvidersMsg.style.display = "none";
      }
      
      // Enable the form submission
      const submitBtn = document.getElementById(SUBMIT_BUTTON_ID);
      if (submitBtn) {
        submitBtn.disabled = false;
      }
    }
  }
  
  // If no compatible providers were found, don't try to show all providers
  if (!anyProviderVisible) {
    console.log("No compatible providers found for currency:", currency);
    return false;
  }
  
  // Ensure all visible providers are enabled
  document.querySelectorAll('.provider-item[style="display: block"] input[name="provider"]')
    .forEach(input => {
      input.disabled = false;
    });
    
  return foundChecked;
}

document.addEventListener("DOMContentLoaded", function () {
  // Ensure all providers have currency attributes
  setupProviderCurrencyAttributes();
  
  // Configure currency change listener
  const currencySelect = document.getElementById("currency");
  if (currencySelect) {
    currencySelect.addEventListener("change", function () {
      filterProvidersByCurrency(this.value);
    });
  }

  // Define supported currency attributes for providers if they are not already defined
  function setupProviderCurrencyAttributes() {
    document.querySelectorAll('input[name="provider"]').forEach((input) => {
      if (!input.hasAttribute("data-supported-currency")) {
        let currency;
        switch (input.value) {
          case "wert":
          case "stripe":
          case "robinhood":
          case "transfi":
          case "rampnetwork":
            currency = "USD";
            break;
          case "werteur":
            currency = "EUR";
            break;
          case "interac":
            currency = "CAD";
            break;
          case "upi":
            currency = "INR";
            break;
          default:
            currency = "ALL";
        }
        input.setAttribute("data-supported-currency", currency);
      }
    });
  }

  // Configure provider change event
  document.querySelectorAll('input[name="provider"]').forEach((input) => {
    input.addEventListener("change", function () {
      if (this.checked) {
        // Update minimum value based on the selected provider
        const minAmount = minAmounts[this.value] || 0;
        const amountInput = document.getElementById("amount");
        if (amountInput) {
          amountInput.setAttribute("min", minAmount);
          amountInput.setAttribute("placeholder", `Min: ${minAmount}`);
        }

        // Highlight the selected card
        document.querySelectorAll(".provider-card").forEach((card) => {
          card.classList.remove("selected");
        });
        this.closest(".provider-card").classList.add("selected");

        // Update currency selection based on the selected provider
        const providerValue = this.value;
        const currencySelect = document.getElementById("currency");

        // Define the appropriate currency for the selected provider
        if (
          ["wert", "stripe", "transfi", "robinhood", "rampnetwork"].includes(
            providerValue
          )
        ) {
          currencySelect.value = "USD";
        } else if (providerValue === "werteur") {
          currencySelect.value = "EUR";
        } else if (providerValue === "upi") {
          currencySelect.value = "INR";
        } else if (providerValue === "interac") {
          currencySelect.value = "CAD";
        }
      }
    });
  });
});

// Main initialization when DOM is loaded
document.addEventListener("DOMContentLoaded", async function () {
  // Process URL parameters
  if (!(await processUrlParams())) {
    const form = document.getElementById(FORM_ID);
    if (form) {
      form
        .querySelectorAll("input, button")
        .forEach((element) => (element.disabled = true));
    }
    return;
  }

  // Store the original providers from URL for later use
  const urlParams = new URLSearchParams(window.location.search);
  const hasProvidersParam = urlParams.has("providers");
  const urlProviders = hasProvidersParam ? urlParams.get("providers").split(",") : null;
  
  // Configure currency change listener
  const currencySelect = document.getElementById("currency");
  if (currencySelect) {
    // Ensure USD is selected initially
    currencySelect.value = "USD";
    
    currencySelect.addEventListener("change", function () {
      // Filter by the providers in the URL, but with the new currency
      if (urlProviders && urlProviders.length > 0) {
        filterProvidersByList(urlProviders, this.value);
      } else {
        // If no providers in URL, filter by currency
        filterProvidersByCurrency(this.value);
      }
    });
  }

  // Force initial filtering
  if (!hasProvidersParam) {
    // If there are no providers in the URL, filter only by USD
    await filterProvidersByCurrency("USD");
  } else {
    // If there are providers in the URL, filter first by providers and then by USD
    await filterProvidersByList(urlProviders, "USD");
  }

  // Setup tooltips
  [].slice
    .call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    .map(function (el) {
      return new bootstrap.Tooltip(el);
    });

  // Setup provider card click handler
  setupProviderCardClickHandler();

  // Setup form submission
  const form = document.getElementById(FORM_ID);
  if (form) {
    form.addEventListener("submit", handleFormSubmission);
  }

  // Setup provider search
  const searchInput = document.getElementById("provider-search");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      filterProviderSearch(this.value);
    });
  }

  // Setup theme toggle
  setupThemeToggle();
});

// Setup provider card click handler
function setupProviderCardClickHandler() {
  document.querySelectorAll(".provider-card").forEach(function (card) {
    card.addEventListener("click", function (event) {
      // Only handle if not clicking directly on the input element
      if (event.target.tagName !== "INPUT") {
        const radioInput = this.querySelector('input[type="radio"]');
        if (radioInput && !radioInput.disabled) {
          // Select this radio button
          radioInput.checked = true;

          // Highlight this card
          document.querySelectorAll(".provider-card").forEach((c) => {
            c.classList.remove("selected");
          });
          this.classList.add("selected");

          // Update currency based on provider
          updateCurrencyForProvider(radioInput.value);

          // Update minimum amount
          updateMinimumAmount(radioInput.value);

          // Trigger change event to update UI
          const changeEvent = new Event("change");
          radioInput.dispatchEvent(changeEvent);

          // Prevent event bubbling
          event.stopPropagation();
        }
      }
    });
  });
}

// Update currency selection based on provider
function updateCurrencyForProvider(providerValue) {
  const currencySelect = document.getElementById("currency");
  if (!currencySelect) return;

  if (
    ["wert", "stripe", "transfi", "robinhood", "rampnetwork"].includes(
      providerValue
    )
  ) {
    currencySelect.value = "USD";
  } else if (providerValue === "werteur") {
    currencySelect.value = "EUR";
  } else if (providerValue === "upi") {
    currencySelect.value = "INR";
  } else if (providerValue === "interac") {
    currencySelect.value = "CAD";
  }
}

// Update minimum amount for selected provider
function updateMinimumAmount(providerValue) {
  const minAmount = minAmounts[providerValue] || 0;
  const amountInput = document.getElementById("amount");
  if (amountInput) {
    amountInput.setAttribute("min", minAmount);
    amountInput.setAttribute("placeholder", `Min: ${minAmount}`);
  }
}

// Filter providers by search term
function filterProviderSearch(searchTerm) {
  searchTerm = searchTerm.toLowerCase();
  
  // Only filter among the already visible providers
  document
    .querySelectorAll('.provider-item[style="display: block"]')
    .forEach((item) => {
      const providerName = item
        .querySelector(".provider-name")
        .textContent.toLowerCase();
      
      // Hide providers that don't match the search term
      if (!providerName.includes(searchTerm)) {
        item.style.display = "none";
      }
    });

  // Check if selected provider is now hidden and select a new one if needed
  const selectedProvider = document.querySelector(
    'input[name="provider"]:checked'
  );
  if (selectedProvider) {
    const selectedItem = selectedProvider.closest(".provider-item");
    if (selectedItem && selectedItem.style.display === "none") {
      selectFirstVisibleProvider();
    }
  } else {
    selectFirstVisibleProvider();
  }
  
  // Check if any providers are visible
  const visibleProviders = document.querySelectorAll('.provider-item[style="display: block"]');
  if (visibleProviders.length === 0) {
    let noProvidersMsg = document.getElementById("no-providers-message");
    if (!noProvidersMsg) {
      const providerSection = document.querySelector(".provider-section");
      if (providerSection) {
        noProvidersMsg = document.createElement("div");
        noProvidersMsg.id = "no-providers-message";
        noProvidersMsg.className = "alert alert-warning mt-3";
        providerSection.appendChild(noProvidersMsg);
      }
    }
    
    if (noProvidersMsg) {
      noProvidersMsg.innerHTML = `
        <i class="fas fa-exclamation-circle me-2"></i>
        <span>No payment providers match your search "${searchTerm}".</span>
      `;
      noProvidersMsg.style.display = "block";
      
      // Disable the form submission
      const submitBtn = document.getElementById(SUBMIT_BUTTON_ID);
      if (submitBtn) {
        submitBtn.disabled = true;
      }
    }
  } else {
    // Hide the no providers message if it exists
    const noProvidersMsg = document.getElementById("no-providers-message");
    if (noProvidersMsg) {
      noProvidersMsg.style.display = "none";
    }
    
    // Enable the form submission
    const submitBtn = document.getElementById(SUBMIT_BUTTON_ID);
    if (submitBtn) {
      submitBtn.disabled = false;
    }
  }
}

// Select first visible provider
function selectFirstVisibleProvider() {
  try {
    // Verifica primeiro se os elementos existem
    if (!document.getElementById("amount")) {
      console.warn("Amount field not found");
    }

    const providers = document.querySelectorAll('input[name="provider"]');
    if (!providers || providers.length === 0) {
      console.warn("No payment providers found in the document");
      return;
    }
    
    let selected = false;
    let providerSelected = null;

    // Tenta selecionar um provedor visível
    for (const provider of providers) {
      const card = provider.closest(".provider-item");
      if (card && card.style.display !== "none") {
        try {
          provider.checked = true;
          selected = true;
          providerSelected = provider;

          // Update minimum amount based on the selected provider
          updateMinimumAmount(provider.value);
          break;
        } catch (err) {
          console.warn("Error selecting provider:", err);
          continue; // Tenta o próximo provedor se este falhar
        }
      }
    }

    // Se nenhum provedor visível, torna todos visíveis e seleciona o primeiro
    if (!selected) {
      console.log("No visible providers found, making all visible");
      let providerMadeVisible = false;
      
      // Torna todos os provedores visíveis
      for (const provider of providers) {
        const card = provider.closest(".provider-item");
        if (card) {
          try {
            card.style.display = "";
            providerMadeVisible = true;
          } catch (err) {
            console.warn("Error making provider visible:", err);
          }
        }
      }

      // Seleciona o primeiro provedor se pelo menos um foi tornado visível
      if (providerMadeVisible && providers.length > 0) {
        try {
          providers[0].checked = true;
          updateMinimumAmount(providers[0].value);
          providerSelected = providers[0];
        } catch (err) {
          console.warn("Error selecting first provider:", err);
        }
      }
    }

    // Destaca o cartão selecionado, se houver
    if (providerSelected) {
      try {
        const card = providerSelected.closest(".provider-card");
        if (card) {
          document
            .querySelectorAll(".provider-card")
            .forEach((c) => c.classList.remove("selected"));
          card.classList.add("selected");
        }
      } catch (err) {
        console.warn("Error highlighting provider card:", err);
      }
    }
  } catch (error) {
    console.error("Error selecting first visible provider:", error);
  }
}

// Setup theme toggle
function setupThemeToggle() {
  const themeToggle = document.getElementById("theme-toggle");
  if (!themeToggle) return;

  // Get stored theme or use browser preference
  let storedTheme = localStorage.getItem("theme");
  if (!storedTheme) {
    storedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    localStorage.setItem("theme", storedTheme);
  }

  // Apply theme to body
  document.body.setAttribute("data-bs-theme", storedTheme);
  document.body.setAttribute("data-theme", storedTheme);

  // Update toggle button
  updateThemeButton(themeToggle, storedTheme);

  // Add click listener
  themeToggle.addEventListener("click", () => {
    const currentTheme = document.body.getAttribute("data-bs-theme") || "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    // Save and apply new theme
    localStorage.setItem("theme", newTheme);
    document.body.setAttribute("data-bs-theme", newTheme);
    document.body.setAttribute("data-theme", newTheme);

    // Update button appearance
    updateThemeButton(themeToggle, newTheme);
  });
}

// Update theme button appearance
function updateThemeButton(button, theme) {
  if (theme === "dark") {
    button.innerHTML = '<i class="fas fa-sun"></i>';
    button.classList.add("btn-outline-light");
    button.classList.remove("btn-outline-dark");
  } else {
    button.innerHTML = '<i class="fas fa-moon"></i>';
    button.classList.add("btn-outline-dark");
    button.classList.remove("btn-outline-light");
  }
}

// Add decryptData function to decrypt the providers list
async function decryptData(encryptedData) {
  try {
    if (!encryptedData) {
      console.error("No encrypted data provided");
      return null;
    }
    
    // Verificação mais rigorosa do formato dos dados
    if (typeof encryptedData !== 'string') {
      console.error("Encrypted data must be a string");
      return null;
    }
    
    // Try interpreting directly as a wallet if it starts with 0x (for compatibility)
    if (encryptedData.startsWith("0x") && validateWalletAddress(encryptedData)) {
      return {
        address: encryptedData,
        hideWallet: false
      };
    }
    
    // Fallback para caracteres inválidos - apenas letras, números, - e _
    const cleanedData = encryptedData.replace(/[^A-Za-z0-9\-_]/g, '');
    
    // Se a limpeza removeu caracteres, log um aviso
    if (cleanedData !== encryptedData) {
      console.warn("Invalid characters removed from encrypted data");
    }
    
    // Substitui caracteres URL-safe por base64 padrão
    let base64 = cleanedData.replace(/-/g, "+").replace(/_/g, "/");

    // Add padding if needed
    while (base64.length % 4) {
      base64 += "=";
    }
    
    // Verificação segura antes de decodificar
    try {
      // Tenta decodificar a string base64
      const binaryString = atob(base64);
      
      // Check format type
      if (binaryString.startsWith("F1:")) {
        // Legacy format or fallback encryption
        const parts = binaryString.split(":");
        if (parts.length !== 4) {
          throw new Error("Invalid encrypted data format");
        }

        const salt = parts[1];
        const hashCheck = parts[2];
        const encryptedContent = parts[3];

        // Reconstruct key with salt
        const key = ENCRYPTION_KEY + salt;
        let content = encryptedContent;

        // Apply decryption rounds
        for (let round = 2; round >= 0; round--) {
          let result = "";
          for (let i = 0; i < content.length; i++) {
            const keyByte = key.charCodeAt((i * round + i) % key.length);
            const prevByte = i > 0 ? content.charCodeAt(i - 1) : 0;
            const byte = content.charCodeAt(i) ^ keyByte ^ (prevByte >> 3);
            result += String.fromCharCode(byte);
          }
          content = result;
        }

        // Validate integrity with hash check
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
          hash = (hash * 31 + content.charCodeAt(i)) >>> 0;
        }

        if (hash.toString(16) !== hashCheck) {
          console.error("Integrity check failed");
          return null;
        }

        try {
          // Try to parse as JSON (new format)
          const walletData = JSON.parse(content);
          if (walletData && walletData.address) {
            // New format with hideWallet flag
            if (!validateWalletAddress(walletData.address)) {
              console.error("Decrypted value is not a valid wallet address");
              return null;
            }
            return walletData;
          }
        } catch (e) {
          // If not valid JSON, it's the old format with only wallet address
          if (validateWalletAddress(content)) {
            return {
              address: content,
              hideWallet: false,
            };
          }
          console.error(
            "Decrypted value is not a valid wallet address or wallet data"
          );
          return null;
        }
      } else {
        // Modern format using WebCrypto style encryption
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Extract IV, MAC and ciphertext
        const iv = bytes.slice(0, 16);
        const mac = bytes.slice(16, 48);
        const ciphertext = bytes.slice(48);

        // Prepare key
        const keyBytes = new TextEncoder().encode(ENCRYPTION_KEY);

        // Initialize S-box
        const sBox = new Uint8Array(256);
        for (let i = 0; i < 256; i++) {
          sBox[i] = i;
        }

        // KSA with IV
        let j = 0;
        for (let i = 0; i < 256; i++) {
          j =
            (j + sBox[i] + keyBytes[i % keyBytes.length] + iv[i % iv.length]) %
            256;
          [sBox[i], sBox[j]] = [sBox[j], sBox[i]];
        }

        // Decrypt
        const plaintext = new Uint8Array(ciphertext.length);
        for (let i = 0; i < ciphertext.length; i++) {
          const a = (i + 1) % 256;
          const b = (sBox[a] + sBox[i % 256]) % 256;
          [sBox[a], sBox[b]] = [sBox[b], sBox[a]];
          const k = sBox[(sBox[a] + sBox[b]) % 256];
          plaintext[i] = ciphertext[i] ^ k;
        }

        // Verify MAC
        const calculatedMac = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          let val = iv[i % iv.length];
          for (let j = 0; j < plaintext.length; j++) {
            val ^= plaintext[j];
            val = ((val << 1) | (val >> 7)) & 0xff;
          }
          calculatedMac[i] = val;
        }

        // Check if MACs match
        let macsMatch = true;
        for (let i = 0; i < 32; i++) {
          if (mac[i] !== calculatedMac[i]) {
            macsMatch = false;
            break;
          }
        }

        if (!macsMatch) {
          console.error("Integrity check failed");
          return null;
        }

        // Convert to string and parse JSON
        const decodedText = new TextDecoder().decode(plaintext);
        try {
          // Try to parse as JSON (new format)
          const walletData = JSON.parse(decodedText);
          if (walletData && walletData.address) {
            // New format with hideWallet flag
            if (!validateWalletAddress(walletData.address)) {
              console.error("Decrypted value is not a valid wallet address");
              return null;
            }
            return walletData;
          }
        } catch (e) {
          // If not valid JSON, it's the old format with only wallet address
          if (validateWalletAddress(decodedText)) {
            return {
              address: decodedText,
              hideWallet: false,
            };
          }
          console.error(
            "Decrypted value is not a valid wallet address or wallet data"
          );
          return null;
        }
      }
      return null;
    } catch (decodeError) {
      console.error("Base64 decoding error:", decodeError);
      return null;
    }
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
}
