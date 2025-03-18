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
        <i class="fas fa-${"info" === t ? "info-circle" : "warning" === t ? "exclamation-triangle" : "success" === t ? "check-circle" : "exclamation-circle"} me-2"></i>
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
    e ? ((t.disabled = !0), (a.textContent = "Processing..."), r.classList.remove("d-none")) : ((t.disabled = !1), (a.textContent = "Generate Payment Link"), r.classList.add("d-none"));
}
function copyToClipboard(e) {
    let t = document.createElement("input");
    (t.value = e), document.body.appendChild(t), t.select(), document.execCommand("copy"), document.body.removeChild(t);
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
            if (b.toString(16) !== n) return console.error("Integrity check failed"), null;
            if (validateWalletAddress(o)) return o;
            return console.error("Decrypted value is not a valid wallet address"), null;
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
            for (let T = 0; T < 256; T++) (I = (I + w[T] + A[T % A.length] + v[T % v.length]) % 256), ([w[T], w[I]] = [w[I], w[T]]);
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
                for (let N = 0; N < C.length; N++) (P ^= C[N]), (P = ((P << 1) | (P >> 7)) & 255);
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
            return console.error("Decrypted value is not a valid wallet address"), null;
        }
    } catch (U) {
        return console.error("Decryption error:", U), null;
    }
}
async function generatePaymentLink(e, t, a, r, l = "USD") {
    // Collect all providers selected by the Merchant
    const selectedProviders = [];
    document.querySelectorAll('.merchant-provider-checkbox:checked').forEach(checkbox => {
        selectedProviders.push(checkbox.value);
    });
    
    // Convert the list to a string
    const providersParam = selectedProviders.join(',');
    
    let n = await fetchExternalApi(`https://api.transact.st/control/wallet.php?address=${e}&callback=${encodeURIComponent(`https://paygate.to/payment-link/invoice.php?payment=${Date.now()}_${Math.floor(9e6 * Math.random()) + 1e6}`)}`);
    if (!n.ok) throw Error(`Server response error: ${n.status}`);
    let s = await n.json();
    if (!s || !s.address_in) return console.error("Error generating payment link"), null;
    {
        let i = s.address_in;
        return {
            addressIn: i,
            paymentLink: `https://payment.transact.st/process-payment.php?address=${i}&amount=${t}&provider=${r}&email=${encodeURIComponent(a)}&currency=${l}&allowed_providers=${encodeURIComponent(providersParam)}`,
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
                  <a href="https://wa.me/?text=${encodeURIComponent(`Complete your payment of ${o} ${c} here: ${l}`)}" target="_blank" class="btn btn-success btn-sm" aria-label="Share on WhatsApp">
                    <i class="fab fa-whatsapp me-1"></i> WhatsApp
                  </a>
                  <a href="https://t.me/share/url?url=${encodeURIComponent(l)}&text=${encodeURIComponent(`Complete your payment of ${o} ${c} here:`)}" target="_blank" class="btn btn-primary btn-sm" aria-label="Share on Telegram">
                    <i class="fab fa-telegram me-1"></i> Telegram
                  </a>
                  <a href="mailto:${a}?subject=Payment%20Link&body=${encodeURIComponent(`Complete your payment of ${o} ${c} here: ${l}`)}" class="btn btn-secondary btn-sm" aria-label="Share by Email">
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
        [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]')).map(function (e) {
            return new bootstrap.Tooltip(e);
        });
    } catch (p) {
        console.error("Error displaying result:", p), showToast("Error showing the result. Please try again later.", "error");
    }
}
function setupCopyButton() {
    let e = document.getElementById("copy-link");
    e &&
        e.addEventListener("click", () => {
            document.getElementById("payment-link").select(), document.execCommand("copy");
            let t = bootstrap.Tooltip.getInstance(e);
            e.setAttribute("data-bs-original-title", "Copied!"),
                t.update(),
                setTimeout(() => {
                    e.setAttribute("data-bs-original-title", "Copy to Clipboard"), t.update();
                }, 2e3);
        });
}
function setupTooltips() {
    [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]')).map(function (e) {
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
            showToast("Please enter a valid amount. Check the minimum amount for the selected provider.", "danger"), toggleLoading(!1);
            return;
        }
        if (!validateEmail(o)) {
            showToast("Please enter a valid email address.", "danger"), toggleLoading(!1);
            return;
        }
        if (i < m) {
            showToast(`Minimum amount for ${u} is ${m} ${c}`, "danger"), toggleLoading(!1);
            return;
        }
        let p = await generatePaymentLink(s, i, o, u, c);
        await displayResult(s, i, o, u, p.paymentLink, p.addressIn, p.trackingUrl);
        document.getElementById(RESULT_CONTAINER_ID).scrollIntoView({ behavior: "smooth" });
    } catch (y) {
        console.error("Error:", y), showToast("An error occurred. Please try again.", "danger");
    } finally {
        toggleLoading(!1);
    }
}
function decryptData(encryptedData) {
    try {
        // Replace URL-safe characters and add padding
        let base64 = encryptedData.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        
        const decodedString = atob(base64);
        
        // Check if it's using the P1 format (providers data)
        if (decodedString.startsWith("P1:")) {
            const parts = decodedString.split(':');
            if (parts.length !== 4) {
                throw new Error("Invalid encrypted data format");
            }
            
            const random = parts[1];
            const checksum = parts[2];
            const encryptedContent = parts[3];
            
            const key = ENCRYPTION_KEY + random;
            let result = encryptedContent;
            
            // Reverse the encryption process
            for (let i = 2; i >= 0; i--) {
                let decrypted = "";
                for (let j = 0; j < result.length; j++) {
                    const keyChar = key.charCodeAt((j * i + j) % key.length);
                    const prevChar = j > 0 ? result.charCodeAt(j - 1) : 0;
                    const charCode = result.charCodeAt(j) ^ keyChar ^ (prevChar >> 3);
                    decrypted += String.fromCharCode(charCode);
                }
                result = decrypted;
            }
            
            // Verify checksum
            let calculatedChecksum = 0;
            for (let i = 0; i < result.length; i++) {
                calculatedChecksum = ((calculatedChecksum * 31) + result.charCodeAt(i)) >>> 0;
            }
            
            if (calculatedChecksum.toString(16) !== checksum) {
                console.error("Integrity check failed");
                return null;
            }
            
            return result;
        } else {
            // Not a provider data format
            return null;
        }
    } catch (error) {
        console.error("Decryption error:", error);
        return null;
    }
}
async function processUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const encryptedWallet = urlParams.get('data');
    const encryptedProviders = urlParams.get('providers');
    
    if (encryptedWallet) {
        const walletAddress = decryptWalletAddress(encryptedWallet);
        if (walletAddress) {
            document.getElementById('wallet_address').value = walletAddress;
        } else {
            showToast("Invalid wallet address data", "danger");
        }
    }
    
    // Apply the saved theme immediately
    applyTheme();
    
    // Process allowed providers if provided
    if (encryptedProviders) {
        processAllowedProviders(encryptedProviders);
    }
    
    // Now set USD currency by default and filter providers
    setTimeout(() => {
        // Select USD currency by default
        const currencySelect = document.getElementById('currency');
        if (currencySelect) {
            currencySelect.value = 'USD';
            // Trigger the change event to filter providers by USD
            const changeEvent = new Event('change');
            currencySelect.dispatchEvent(changeEvent);
        }
    }, 100);
}

/**
 * Apply saved theme from localStorage
 */
function applyTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.body.setAttribute("data-theme", savedTheme);
    document.body.setAttribute("data-bs-theme", savedTheme);
    
    const themeToggleIcon = document.querySelector("#theme-toggle i");
    if (themeToggleIcon) {
        if (savedTheme === "dark") {
            themeToggleIcon.classList.remove("fa-moon");
            themeToggleIcon.classList.add("fa-sun");
        } else {
            themeToggleIcon.classList.remove("fa-sun");
            themeToggleIcon.classList.add("fa-moon");
        }
    }
    
    // Apply theme-specific styles
    fixDarkModeStyles();
}

/**
 * Process allowed providers from the encrypted URL parameter
 */
function processAllowedProviders(encryptedProviders) {
    try {
        // Decrypt the providers list
        const providersString = decryptData(encryptedProviders);
        
        if (providersString) {
            // Convert to array 
            const providersArray = providersString.split(',');
            
            console.log("Allowed providers:", providersArray);
            
            // If only one provider is allowed, show only that one
            if (providersArray.length === 1) {
                const singleProvider = providersArray[0];
                
                // Hide all providers except the allowed one
                document.querySelectorAll('.provider-item').forEach(provider => {
                    const providerInput = provider.querySelector('input[name="provider"]');
                    if (providerInput) {
                        const providerValue = providerInput.value;
                        
                        if (providerValue === singleProvider) {
                            provider.style.display = 'block';
                            providerInput.checked = true;
                            providerInput.closest('.provider-card').classList.add('selected');
                            
                            // Hide the entire provider section if only one provider
                            const providerSection = document.querySelector('.provider-section');
                            if (providerSection) {
                                providerSection.classList.add('single-provider-mode');
                                
                                // Add a message showing which provider is being used
                                const providerName = provider.querySelector('.provider-name').textContent;
                                const singleProviderMessage = document.createElement('div');
                                singleProviderMessage.className = 'alert alert-info mt-2';
                                singleProviderMessage.innerHTML = `<i class="fas fa-info-circle me-2"></i> Using payment provider: <strong>${providerName}</strong>`;
                                
                                // Insert the message before the provider section
                                providerSection.parentNode.insertBefore(singleProviderMessage, providerSection.nextSibling);
                                
                                // Hide filter section since there's only one provider
                                const filterSection = providerSection.querySelector('.provider-filter');
                                if (filterSection) {
                                    filterSection.style.display = 'none';
                                }
                            }
                        } else {
                            provider.style.display = 'none';
                            providerInput.disabled = true;
                            providerInput.checked = false;
                        }
                    }
                });
            } else {
                // Multiple providers - hide only those not in the allowed list
                document.querySelectorAll('.provider-item').forEach(provider => {
                    const providerInput = provider.querySelector('input[name="provider"]');
                    if (providerInput) {
                        const providerValue = providerInput.value;
                        
                        // Show only if it is in the allowed list
                        if (!providersArray.includes(providerValue)) {
                            provider.style.display = 'none';
                            providerInput.disabled = true;
                            providerInput.checked = false;
                        }
                    }
                });
            }
        }
    } catch (error) {
        console.error("Error processing allowed providers:", error);
    }
}

/**
 * Filter providers by selected currency
 */
function filterProvidersByCurrency(currency) {
    // Get all provider items
    const providerItems = document.querySelectorAll('.provider-item');
    let providerFound = false;
    let visibleProviders = 0;
    
    // Check if there are any providers
    if (providerItems.length === 0) {
        // Show a message if no providers are available
        const providerSection = document.querySelector('.provider-section');
        if (providerSection) {
            // Check if we've already added the message
            if (!document.querySelector('.no-providers-message')) {
                const noProvidersMessage = document.createElement('div');
                noProvidersMessage.className = 'alert alert-warning no-providers-message';
                noProvidersMessage.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i> No payment providers available for selection.';
                providerSection.parentNode.insertBefore(noProvidersMessage, providerSection);
            }
        }
        return;
    }
    
    // Loop through each provider
    providerItems.forEach(item => {
        // Skip if the item is already hidden (not in allowed providers list)
        if (item.style.display === 'none') return;
        
        const providerInput = item.querySelector('input[name="provider"]');
        if (!providerInput) return;
        
        const supportedCurrency = providerInput.getAttribute('data-supported-currency');
        
        // Show if supported currency is ALL or matches selected currency
        if (supportedCurrency === 'ALL' || supportedCurrency === currency) {
            item.style.display = 'block';
            visibleProviders++;
            
            // Select the first available provider if none is selected
            if (!providerFound && !document.querySelector('input[name="provider"]:checked')) {
                providerInput.checked = true;
                providerInput.closest('.provider-card').classList.add('selected');
                providerFound = true;
            }
        } else {
            // Hide if currency doesn't match
            item.style.display = 'none';
            providerInput.checked = false;
            providerInput.closest('.provider-card').classList.remove('selected');
        }
    });
    
    // If no providers are visible for this currency, show a message
    if (visibleProviders === 0) {
        // Show a message if no providers are available for this currency
        const providerSection = document.querySelector('.provider-section');
        if (providerSection) {
            // Check if we've already added the message
            const existingMessage = document.querySelector('.no-currency-providers-message');
            if (!existingMessage) {
                const noCurrencyMessage = document.createElement('div');
                noCurrencyMessage.className = 'alert alert-warning no-currency-providers-message';
                noCurrencyMessage.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i> No payment providers available for ${currency}. Please select a different currency.`;
                providerSection.parentNode.insertBefore(noCurrencyMessage, providerSection);
            } else {
                // Update existing message
                existingMessage.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i> No payment providers available for ${currency}. Please select a different currency.`;
            }
        }
    } else {
        // Remove the message if providers are available
        const existingMessage = document.querySelector('.no-currency-providers-message');
        if (existingMessage) {
            existingMessage.remove();
        }
    }
    
    // If no provider is selected but there are visible ones, select the first
    if (!document.querySelector('input[name="provider"]:checked') && visibleProviders > 0) {
        selectFirstAvailableProvider();
    }
}

/**
 * Select the first available provider that is visible
 */
function selectFirstAvailableProvider() {
    const firstVisibleProvider = document.querySelector('.provider-item[style="display: block"] input[name="provider"]');
    if (firstVisibleProvider) {
        firstVisibleProvider.checked = true;
        
        // Add selected class to the card
        document.querySelectorAll('.provider-card').forEach(card => {
            card.classList.remove('selected');
        });
        firstVisibleProvider.closest('.provider-card').classList.add('selected');
        
        // Trigger change event to update any related logic
        const changeEvent = new Event('change');
        firstVisibleProvider.dispatchEvent(changeEvent);
    }
}

document.addEventListener("DOMContentLoaded", function() {
    // Process URL parameters first
    processUrlParams();
    
    // Setup tooltips
    setupTooltips();
    
    // Enhance provider card click functionality - make the entire card clickable
    document.querySelectorAll(".provider-card").forEach(function(card) {
        card.addEventListener("click", function(e) {
            // Don't process if clicking on the radio input itself
            if (e.target.type !== "radio") {
                const radioInput = this.querySelector('input[type="radio"]');
                if (radioInput && !radioInput.disabled) {
                    radioInput.checked = true;
                    
                    // Manually trigger the change event
                    const changeEvent = new Event('change');
                    radioInput.dispatchEvent(changeEvent);
                    
                    // Update the selected card styling
                    document.querySelectorAll(".provider-card").forEach((otherCard) => {
                        otherCard.classList.remove("selected");
                    });
                    this.classList.add("selected");
                }
            }
        });
    });
    
    // Apply theme-based styling
    setTimeout(fixDarkModeStyles, 100);
});

// Currency change event
document.getElementById("currency").addEventListener("change", function() {
    filterProvidersByCurrency(this.value);
});

// Amount change validation
document.getElementById("amount").addEventListener("change", function() {
    const amount = parseFloat(this.value);
    const providerValue = document.querySelector('input[name="provider"]:checked')?.value;
    
    if (providerValue) {
        const minAmount = minAmounts[providerValue] || 0;
        if (amount < minAmount) {
            this.setCustomValidity(`Minimum amount for ${providerValue} is ${minAmount}`);
            showToast(`Minimum amount for ${providerValue} is ${minAmount}`, "warning");
        } else {
            this.setCustomValidity("");
        }
    }
});

// Provider change event
document.querySelectorAll('input[name="provider"]').forEach(input => {
    input.addEventListener("change", function() {
        const providerValue = this.value;
        const currencySelect = document.getElementById("currency");
        
        // Set appropriate currency based on provider
        if (['wert', 'stripe', 'transfi', 'robinhood', 'rampnetwork'].includes(providerValue)) {
            currencySelect.value = "USD";
        } else if (providerValue === 'werteur') {
            currencySelect.value = "EUR";
        } else if (providerValue === 'upi') {
            currencySelect.value = "INR";
        } else if (providerValue === 'interac') {
            currencySelect.value = "CAD";
        }
        
        // Update minimum amount based on selected provider
        const minAmount = minAmounts[providerValue] || 0;
        const amountInput = document.getElementById("amount");
        amountInput.setAttribute("min", minAmount);
        amountInput.setAttribute("placeholder", `Min: ${minAmount}`);
        
        // Update selected card styling
        document.querySelectorAll(".provider-card").forEach(card => {
            card.classList.remove("selected");
        });
        this.closest(".provider-card").classList.add("selected");
    });
});

// Search functionality
const providerSearch = document.getElementById("provider-search");
providerSearch.addEventListener("input", function() {
    const searchTerm = this.value.toLowerCase();
    
    document.querySelectorAll(".provider-item").forEach(item => {
        // Only search among visible items (matching currency and allowed)
        if (item.style.display !== 'none') {
            const providerNameElement = item.querySelector(".provider-name");
            if (providerNameElement) {
                const providerName = providerNameElement.textContent.toLowerCase();
                if (providerName.includes(searchTerm)) {
                    item.style.display = "block";
                } else {
                    item.style.display = "none";
                    // Uncheck if hidden by search
                    const input = item.querySelector('input[name="provider"]');
                    if (input && input.checked) {
                        input.checked = false;
                    }
                }
            }
        }
    });
    
    // If the currently selected provider is now hidden, select the first visible one
    const selectedProvider = document.querySelector('input[name="provider"]:checked');
    if (!selectedProvider || selectedProvider.closest('.provider-item').style.display === 'none') {
        selectFirstAvailableProvider();
    }
});

/**
 * Fix Dark Mode styling issues
 */
function fixDarkModeStyles() {
    const isDarkMode = document.body.getAttribute('data-bs-theme') === 'dark' || 
                      document.body.getAttribute('data-theme') === 'dark';
    
    // Apply theme-specific styles
    if (isDarkMode) {
        // Dark mode styles
        document.querySelectorAll('.provider-card').forEach(card => {
            card.style.backgroundColor = '#1e293b';
            card.style.borderColor = 'rgba(255,255,255,0.1)';
        });
        
        document.querySelectorAll('.provider-card.selected').forEach(card => {
            card.style.backgroundColor = 'rgba(96,165,250,0.15)';
            card.style.borderColor = '#60a5fa';
        });
        
        // Fix search input
        const searchInput = document.getElementById('provider-search');
        if (searchInput) {
            searchInput.style.backgroundColor = '#1e293b';
            searchInput.style.color = '#f8fafc';
            searchInput.style.borderColor = '#334155';
        }
        
        // Fix provider section background
        const providerSection = document.querySelector('.provider-section');
        if (providerSection) {
            providerSection.style.backgroundColor = '#0f172a';
            providerSection.style.borderColor = '#334155';
        }
        
        // Fix provider filter
        const providerFilter = document.querySelector('.provider-filter');
        if (providerFilter) {
            providerFilter.style.backgroundColor = '#1e293b';
            providerFilter.style.borderColor = '#334155';
        }
        
        // Fix provider group
        const providerGroup = document.querySelector('.provider-group');
        if (providerGroup) {
            providerGroup.style.backgroundColor = '#0f172a';
        }
    } else {
        // Light mode styles
        document.querySelectorAll('.provider-card').forEach(card => {
            card.style.backgroundColor = '#ffffff';
            card.style.borderColor = 'transparent';
        });
        
        document.querySelectorAll('.provider-card.selected').forEach(card => {
            card.style.backgroundColor = 'rgba(58,134,255,0.05)';
            card.style.borderColor = '#3a86ff';
        });
        
        // Fix search input
        const searchInput = document.getElementById('provider-search');
        if (searchInput) {
            searchInput.style.backgroundColor = '#ffffff';
            searchInput.style.color = '#1e293b';
            searchInput.style.borderColor = '#e2e8f0';
        }
        
        // Fix provider section background
        const providerSection = document.querySelector('.provider-section');
        if (providerSection) {
            providerSection.style.backgroundColor = '#f8fafc';
            providerSection.style.borderColor = '#e2e8f0';
        }
        
        // Fix provider filter
        const providerFilter = document.querySelector('.provider-filter');
        if (providerFilter) {
            providerFilter.style.backgroundColor = '#ffffff';
            providerFilter.style.borderColor = '#e2e8f0';
        }
        
        // Fix provider group
        const providerGroup = document.querySelector('.provider-group');
        if (providerGroup) {
            providerGroup.style.backgroundColor = '#f8fafc';
        }
    }
}

// Theme toggle functionality
document.addEventListener("DOMContentLoaded", function() {
  const themeToggle = document.getElementById("theme-toggle");
  
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      // Get current theme
      const currentTheme = document.body.getAttribute("data-theme") || "light";
      // Toggle theme
      const newTheme = currentTheme === "light" ? "dark" : "light";
      
      // Update theme in localStorage
      localStorage.setItem("theme", newTheme);
      
      // Apply new theme
      document.body.setAttribute("data-theme", newTheme);
      document.body.setAttribute("data-bs-theme", newTheme);
      
      // Update icon
      const themeIcon = themeToggle.querySelector("i");
      if (themeIcon) {
        if (newTheme === "dark") {
          themeIcon.classList.remove("fa-moon");
          themeIcon.classList.add("fa-sun");
        } else {
          themeIcon.classList.remove("fa-sun");
          themeIcon.classList.add("fa-moon");
        }
      }
      
      // Apply theme-specific styles
      setTimeout(fixDarkModeStyles, 100);
    });
  }
  
  // Process URL parameters
  processUrlParams().then(() => {
    // Set up tooltips
    setupTooltips();
    
    // Apply theme from localStorage
    setTimeout(applyTheme, 50);
  }).catch(error => {
    console.error("Error processing URL parameters:", error);
    showToast("An error occurred while loading the page. Please refresh and try again.", "danger");
  });
  
  // Set up form submission
  const form = document.getElementById(FORM_ID);
  if (form) {
    form.addEventListener("submit", handleFormSubmission);
  }
});
