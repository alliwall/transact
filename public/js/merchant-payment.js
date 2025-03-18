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
    let n = await fetchExternalApi(`https://api.transact.st/control/wallet.php?address=${e}&callback=${encodeURIComponent(`https://paygate.to/payment-link/invoice.php?payment=${Date.now()}_${Math.floor(9e6 * Math.random()) + 1e6}`)}`);
    if (!n.ok) throw Error(`Server response error: ${n.status}`);
    let s = await n.json();
    if (!s || !s.address_in) return console.error("Error generating payment link"), null;
    {
        let i = s.address_in;
        return {
            addressIn: i,
            paymentLink: `https://payment.transact.st/process-payment.php?address=${i}&amount=${t}&provider=${r}&email=${encodeURIComponent(a)}&currency=${l}`,
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
async function decryptData(encryptedData) {
    try {
        let base64 = encryptedData.replace(/-/g, '+').replace(/_/g, '/');
        
        // Add padding if needed
        while (base64.length % 4) {
            base64 += '=';
        }
        
        // Convert base64 to binary
        const binaryString = atob(base64);
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
        
        // KSA
        let j = 0;
        for (let i = 0; i < 256; i++) {
            j = (j + sBox[i] + keyBytes[i % keyBytes.length] + iv[i % iv.length]) % 256;
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
                val = ((val << 1) | (val >> 7)) & 0xFF;
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
        
        // Convert to string
        return new TextDecoder().decode(plaintext);
    } catch (error) {
        console.error("Decryption error:", error);
        return null;
    }
}
async function processUrlParams() {
    try {
        // Get wallet data parameter
        const data = new URLSearchParams(window.location.search).get("data");
        if (!data) {
            showToast("No wallet data provided. Please use a valid payment link.", "danger");
            return false;
        }
        
        // Decrypt wallet address
        const walletAddress = await decryptWalletAddress(data);
        if (!walletAddress || !validateWalletAddress(walletAddress)) {
            showToast("Invalid or corrupted wallet data. Please use a valid payment link.", "danger");
            return false;
        }
        
        // Set wallet address in input field
        document.getElementById(WALLET_ADDRESS_ID).value = walletAddress;
        
        // Update merchant info message
        const merchantInfo = document.getElementById("merchant-info");
        if (merchantInfo) {
            merchantInfo.innerHTML = "<strong>Merchant Payment:</strong> You are creating a payment link that will send funds to the merchant wallet address shown below. This address is locked and cannot be changed.";
        }
        
        // Set data-supported-currency attributes if not already set
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
        
        // Ensure USD is pre-selected
        const currencySelect = document.getElementById("currency");
        if (currencySelect) {
            currencySelect.value = "USD";
        }
        
        // Get allowed providers
        let allowedProviders = null;
        
        // Process provider restrictions if present
        const encryptedProviders = new URLSearchParams(window.location.search).get("providers");
        if (encryptedProviders) {
            try {
                // Decrypt providers list
                const providersString = await decryptData(encryptedProviders);
                if (providersString) {
                    allowedProviders = providersString.split(',');
                    
                    // Show info message about restricted providers
                    const providersInfo = document.getElementById("providers-info");
                    if (providersInfo) {
                        providersInfo.classList.remove("d-none");
                    }
                } else {
                    // If decryption fails, default to show all providers
                    console.warn("Provider decryption failed, showing all providers");
                }
            } catch (decryptError) {
                console.error("Error decrypting providers:", decryptError);
                // Continue without restriction if there's an error
            }
        }
        
        // Show only USD providers initially
        const currency = "USD";
        let foundChecked = false;
        
        document.querySelectorAll('.provider-item').forEach(item => {
            const providerInput = item.querySelector('input[name="provider"]');
            if (!providerInput) return;
            
            const supportedCurrency = providerInput.getAttribute("data-supported-currency");
            const providerValue = providerInput.value;
            
            // Check if provider is in the allowed list (if restriction exists)
            const isAllowed = !allowedProviders || allowedProviders.includes(providerValue);
            
            // Show the provider if it supports USD or ALL currencies AND is in the allowed list
            if ((supportedCurrency === "ALL" || supportedCurrency === currency) && isAllowed) {
                item.style.display = "block";
                providerInput.disabled = false;
                
                // Select the first available provider
                if (!foundChecked) {
                    providerInput.checked = true;
                    foundChecked = true;
                    
                    // Update minimum amount
                    const minAmount = minAmounts[providerValue] || 0;
                    const amountInput = document.getElementById("amount");
                    if (amountInput) {
                        amountInput.setAttribute("min", minAmount);
                        amountInput.setAttribute("placeholder", `Min: ${minAmount}`);
                    }
                    
                    // Highlight selected card
                    const card = providerInput.closest(".provider-card");
                    if (card) {
                        document.querySelectorAll('.provider-card').forEach(c => {
                            c.classList.remove("selected");
                        });
                        card.classList.add("selected");
                    }
                }
            } else {
                item.style.display = "none";
                providerInput.checked = false;
            }
        });
        
        // If no provider was found/checked, try to find any visible provider
        if (!foundChecked) {
            // Try with ALL currency providers
            document.querySelectorAll('.provider-item').forEach(item => {
                const providerInput = item.querySelector('input[name="provider"]');
                if (!providerInput) return;
                
                const supportedCurrency = providerInput.getAttribute("data-supported-currency");
                const providerValue = providerInput.value;
                
                // Check if provider is in the allowed list (if restriction exists)
                const isAllowed = !allowedProviders || allowedProviders.includes(providerValue);
                
                // Show providers that support ALL currencies
                if (supportedCurrency === "ALL" && isAllowed && !foundChecked) {
                    item.style.display = "block";
                    providerInput.disabled = false;
                    providerInput.checked = true;
                    foundChecked = true;
                    
                    // Update minimum amount
                    const minAmount = minAmounts[providerValue] || 0;
                    const amountInput = document.getElementById("amount");
                    if (amountInput) {
                        amountInput.setAttribute("min", minAmount);
                        amountInput.setAttribute("placeholder", `Min: ${minAmount}`);
                    }
                    
                    // Highlight selected card
                    const card = providerInput.closest(".provider-card");
                    if (card) {
                        document.querySelectorAll('.provider-card').forEach(c => {
                            c.classList.remove("selected");
                        });
                        card.classList.add("selected");
                    }
                }
            });
        }
        
        // Final check: if still no provider is checked, show the first available provider regardless of currency
        if (!foundChecked && allowedProviders) {
            const firstAllowedProvider = document.querySelector(`input[name="provider"][value="${allowedProviders[0]}"]`);
            if (firstAllowedProvider) {
                const item = firstAllowedProvider.closest('.provider-item');
                if (item) {
                    item.style.display = "block";
                    firstAllowedProvider.disabled = false;
                    firstAllowedProvider.checked = true;
                    
                    // Update minimum amount
                    const minAmount = minAmounts[firstAllowedProvider.value] || 0;
                    const amountInput = document.getElementById("amount");
                    if (amountInput) {
                        amountInput.setAttribute("min", minAmount);
                        amountInput.setAttribute("placeholder", `Min: ${minAmount}`);
                    }
                    
                    // Highlight selected card
                    const card = firstAllowedProvider.closest(".provider-card");
                    if (card) {
                        document.querySelectorAll('.provider-card').forEach(c => {
                            c.classList.remove("selected");
                        });
                        card.classList.add("selected");
                    }
                }
            }
        }
        
        // Ensure all visible provider radio buttons are enabled
        document.querySelectorAll('.provider-item[style="display: block"] input[name="provider"]').forEach(input => {
            input.disabled = false;
        });
        
        return true;
    } catch (error) {
        console.error("Error processing URL parameters:", error);
        showToast("Error processing the payment link. Please try again with a valid link.", "danger");
        return false;
    }
}
async function filterProvidersByCurrency(currency) {
    let foundChecked = false;
    
    document.querySelectorAll('.provider-item').forEach(item => {
        const providerInput = item.querySelector('input[name="provider"]');
        if (!providerInput) return;
        
        const supportedCurrency = providerInput.getAttribute('data-supported-currency');
        
        // Check if provider supports this currency or supports all currencies
        if (supportedCurrency === 'ALL' || supportedCurrency === currency) {
            if (item.style.display !== 'none') {
                // Check if the input should be displayed based on other filters
                providerInput.disabled = false;
                
                // Select the first provider if none is selected
                if (!foundChecked) {
                    providerInput.checked = true;
                    foundChecked = true;
                    
                    // Update minimum amount
                    const minAmount = minAmounts[providerInput.value] || 0;
                    const amountInput = document.getElementById('amount');
                    if (amountInput) {
                        amountInput.setAttribute('min', minAmount);
                        amountInput.setAttribute('placeholder', `Min: ${minAmount}`);
                    }
                    
                    // Highlight selected card
                    const card = providerInput.closest('.provider-card');
                    if (card) {
                        document.querySelectorAll('.provider-card').forEach(c => {
                            c.classList.remove('selected');
                        });
                        card.classList.add('selected');
                    }
                }
            }
        } else {
            item.style.display = 'none';
            providerInput.checked = false;
        }
    });
    
    // Ensure all visible provider radio buttons are enabled
    document.querySelectorAll('.provider-item[style="display: block"] input[name="provider"]').forEach(input => {
        input.disabled = false;
    });
    
    return foundChecked;
}

// Make provider cards clickable
document.querySelectorAll('.provider-card').forEach(card => {
    card.addEventListener('click', (event) => {
        // Skip if clicking on the input itself
        if (event.target.tagName === 'INPUT' || event.target.closest('input')) {
            return;
        }
        
        // Find the radio input inside the card
        const radio = card.querySelector('input[type="radio"]');
        if (radio && !radio.disabled) {
            // Check the radio button
            radio.checked = true;
            
            // Highlight the selected card
            document.querySelectorAll('.provider-card').forEach(c => {
                c.classList.remove('selected');
            });
            card.classList.add('selected');
            
            // Trigger change event to update UI
            const changeEvent = new Event('change');
            radio.dispatchEvent(changeEvent);
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
    // Setup currency change listener
    const currencySelect = document.getElementById("currency");
    if (currencySelect) {
        // Set USD as default currency
        currencySelect.value = "USD";
        
        // Filter providers immediately based on USD
        filterProvidersByCurrency("USD");
        
        // Add change event listener
        currencySelect.addEventListener("change", function() {
            filterProvidersByCurrency(this.value);
        });
    }
    
    // Setup provider change listener
    document.querySelectorAll('input[name="provider"]').forEach(input => {
        input.addEventListener('change', function() {
            if (this.checked) {
                // Highlight the selected card
                document.querySelectorAll('.provider-card').forEach(card => {
                    card.classList.remove('selected');
                });
                const selectedCard = this.closest('.provider-card');
                if (selectedCard) {
                    selectedCard.classList.add('selected');
                }
                
                // Update minimum amount based on the selected provider
                const minAmount = minAmounts[this.value] || 0;
                const amountInput = document.getElementById("amount");
                if (amountInput) {
                    amountInput.setAttribute("min", minAmount);
                    amountInput.setAttribute("placeholder", `Min: ${minAmount}`);
                }
            }
        });
    });
    
    // Process URL parameters when page loads
    processUrlParams();
    
    // Setup form submission
    setupFormSubmission();
    
    // Setup provider filter
    setupProviderFilter();
});

// Setup form submission
function setupFormSubmission() {
    const form = document.getElementById(FORM_ID);
    if (form) {
        form.addEventListener("submit", async function(event) {
            event.preventDefault();
            
            const submitBtn = document.getElementById("submit-btn");
            const submitText = document.getElementById("submit-text");
            const loadingSpinner = document.getElementById("loading-spinner");
            
            // Disable button and show spinner
            submitBtn.disabled = true;
            submitText.classList.add("d-none");
            loadingSpinner.classList.remove("d-none");
            
            // Get form data
            const formData = new FormData(form);
            const jsonData = {};
            
            // Convert form data to JSON
            for (const [key, value] of formData.entries()) {
                jsonData[key] = value;
            }
            
            try {
                // Make API request to create payment link
                const response = await fetch("/api/merchant-payment", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').getAttribute("content")
                    },
                    body: JSON.stringify(jsonData)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    // Display success and payment link
                    const paymentResult = document.getElementById("payment-result");
                    if (paymentResult) {
                        paymentResult.innerHTML = `
                            <div class="alert alert-success" role="alert">
                                <h4 class="alert-heading">Payment Link Created!</h4>
                                <p>Share this link with your customer:</p>
                                <div class="input-group mb-3">
                                    <input type="text" class="form-control" value="${result.url}" id="payment-link" readonly>
                                    <button class="btn btn-outline-secondary" type="button" id="copy-link">Copy</button>
                                </div>
                                <p class="mb-0">The link will expire in 24 hours.</p>
                            </div>
                        `;
                        
                        // Setup copy button
                        const copyBtn = document.getElementById("copy-link");
                        if (copyBtn) {
                            copyBtn.addEventListener("click", function() {
                                const paymentLink = document.getElementById("payment-link");
                                paymentLink.select();
                                document.execCommand("copy");
                                
                                // Change button text temporarily
                                const originalText = copyBtn.innerText;
                                copyBtn.innerText = "Copied!";
                                setTimeout(() => {
                                    copyBtn.innerText = originalText;
                                }, 2000);
                            });
                        }
                        
                        // Scroll to result
                        paymentResult.scrollIntoView({ behavior: "smooth" });
                    }
                } else {
                    // Display error
                    showToast(result.error || "Error creating payment link. Please try again.", "danger");
                }
            } catch (error) {
                console.error("Error submitting form:", error);
                showToast("An unexpected error occurred. Please try again later.", "danger");
            } finally {
                // Re-enable button and hide spinner
                submitBtn.disabled = false;
                submitText.classList.remove("d-none");
                loadingSpinner.classList.add("d-none");
            }
        });
    }
}

// Setup provider filter
function setupProviderFilter() {
    const providerSearch = document.getElementById("provider-search");
    if (providerSearch) {
        providerSearch.addEventListener("input", function() {
            const searchTerm = this.value.toLowerCase();
            
            document.querySelectorAll('.provider-item').forEach(item => {
                // Only search among visible items (those that match currency filter)
                if (item.style.display !== 'none') {
                    const providerName = item.querySelector(".provider-name").textContent.toLowerCase();
                    
                    if (providerName.includes(searchTerm)) {
                        item.style.display = "block";
                    } else {
                        item.style.display = "none";
                    }
                }
            });
            
            // Check if we need to select a new provider if the currently selected one is hidden
            const selectedProvider = document.querySelector('input[name="provider"]:checked');
            if (selectedProvider) {
                const selectedItem = selectedProvider.closest('.provider-item');
                
                if (selectedItem && selectedItem.style.display === 'none') {
                    // Find first visible provider and select it
                    const firstVisibleProvider = document.querySelector('.provider-item[style="display: block"] input[name="provider"]');
                    if (firstVisibleProvider) {
                        firstVisibleProvider.checked = true;
                        
                        // Update minimum amount
                        const minAmount = minAmounts[firstVisibleProvider.value] || 0;
                        const amountInput = document.getElementById("amount");
                        if (amountInput) {
                            amountInput.setAttribute("min", minAmount);
                            amountInput.setAttribute("placeholder", `Min: ${minAmount}`);
                        }
                        
                        // Highlight selected card
                        document.querySelectorAll('.provider-card').forEach(card => {
                            card.classList.remove('selected');
                        });
                        firstVisibleProvider.closest('.provider-card').classList.add('selected');
                    }
                }
            }
        });
    }
}
