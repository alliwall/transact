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
        if (!walletAddress || !validateWalletAddress(walletAddress)) return showToast("Invalid or corrupted wallet data. Please use a valid payment link.", "danger"), false;
        
        // Set wallet address in input field
        document.getElementById(WALLET_ADDRESS_ID).value = walletAddress;
        
        // Update merchant info message
        const merchantInfo = document.getElementById("merchant-info");
        if (merchantInfo) {
            merchantInfo.innerHTML = "<strong>Merchant Payment:</strong> You are creating a payment link that will send funds to the merchant wallet address shown below. This address is locked and cannot be changed.";
        }
        
        // Process provider restrictions if present
        const providersParam = new URLSearchParams(window.location.search).get("providers");
        if (providersParam) {
            const allowedProviders = providersParam.split(',');
            
            // Show info message about restricted providers
            const providersInfo = document.getElementById("providers-info");
            if (providersInfo) {
                providersInfo.classList.remove("d-none");
            }
            
            // Hide providers that aren't in the allowed list
            document.querySelectorAll('.provider-item').forEach(item => {
                const providerInput = item.querySelector('input[name="provider"]');
                if (providerInput) {
                    const providerValue = providerInput.value;
                    
                    if (!allowedProviders.includes(providerValue)) {
                        item.style.display = 'none';
                        providerInput.checked = false;
                    } else {
                        item.style.display = 'block';
                    }
                }
            });
            
            // Select the first available provider
            const firstAvailableProvider = document.querySelector(`.provider-item[style="display: block"] input[name="provider"]`);
            if (firstAvailableProvider) {
                firstAvailableProvider.checked = true;
                
                // Trigger change event to update UI
                const changeEvent = new Event('change');
                firstAvailableProvider.dispatchEvent(changeEvent);
            }
        }
        
        return true;
    } catch (error) {
        console.error("Error processing URL parameters:", error);
        showToast("Error processing the payment link. Please try again with a valid link.", "danger");
        return false;
    }
}
function filterProvidersByCurrency(currency) {
    const providerItems = document.querySelectorAll(".provider-item");
    let foundChecked = false;
    
    // Get providers restriction from URL if present
    const params = new URLSearchParams(window.location.search);
    const providersParam = params.get("providers");
    const allowedProviders = providersParam ? providersParam.split(',') : null;
    
    providerItems.forEach((item) => {
        const providerInput = item.querySelector('input[name="provider"]');
        const supportedCurrency = providerInput.getAttribute("data-supported-currency");
        
        // Check if provider is in the allowed list (if restriction exists)
        const isAllowed = !allowedProviders || allowedProviders.includes(providerInput.value);
        
        // Show the provider if it supports the currency AND is in the allowed list
        if ((supportedCurrency === "ALL" || supportedCurrency === currency) && isAllowed) {
            item.style.display = "block";
            
            // Select the first visible provider if none is selected yet
            if (!foundChecked) {
                providerInput.checked = true;
                foundChecked = true;
            }
        } else {
            item.style.display = "none";
            providerInput.checked = false;
        }
    });
}
document.getElementById("currency").addEventListener("change", function () {
    filterProvidersByCurrency(this.value);
}),
    document.querySelectorAll('input[name="provider"]').forEach((e) => {
        let t = e.value,
            a;
        switch (t) {
            case "wert":
            case "stripe":
            case "robinhood":
            case "transfi":
            case "rampnetwork":
                a = "USD";
                break;
            case "werteur":
                a = "EUR";
                break;
            case "interac":
                a = "CAD";
                break;
            case "upi":
                a = "INR";
                break;
            default:
                a = "ALL";
        }
        e.setAttribute("data-supported-currency", a);
    }),
    document.querySelectorAll('input[name="provider"]').forEach((e) => {
        e.addEventListener("change", function () {
            let e = minAmounts[this.value] || 0,
                t = document.getElementById("amount");
            t.setAttribute("min", e),
                t.setAttribute("placeholder", `Min: ${e}`),
                document.querySelectorAll(".provider-card").forEach((e) => {
                    e.classList.remove("selected");
                }),
                this.closest(".provider-card").classList.add("selected");
        });
    }),
    document.addEventListener("DOMContentLoaded", function () {
        // Initial call to filter providers based on the selected currency (USD)
        filterProvidersByCurrency(document.getElementById("currency").value);
        
        [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]')).map(function (e) {
            return new bootstrap.Tooltip(e);
        });
        let e = document.querySelector('input[name="provider"]:checked').value,
            t = document.getElementById("amount");
        t.setAttribute("min", minAmounts[e]), t.setAttribute("placeholder", `Min: ${minAmounts[e]}`);
        document.querySelector('input[name="provider"]:checked').closest(".provider-card").classList.add("selected"),
            document.querySelectorAll(".provider-card").forEach(function (e) {
                e.addEventListener("click", function (e) {
                    if ("INPUT" !== e.target.tagName) {
                        let t = this.querySelector('input[type="radio"]');
                        if (t) {
                            t.checked = !0;
                            let a = new Event("change");
                            t.dispatchEvent(a),
                                document.querySelectorAll(".provider-card").forEach((e) => {
                                    e.classList.remove("selected");
                                }),
                                this.classList.add("selected");
                        }
                    }
                });
            });
    }),
    document.addEventListener("DOMContentLoaded", async function () {
        if (!(await processUrlParams())) {
            let e = document.getElementById(FORM_ID);
            e && e.querySelectorAll("input, button").forEach((e) => (e.disabled = !0));
            return;
        }
        let t = document.getElementById(FORM_ID);
        t && t.addEventListener("submit", handleFormSubmission);
        document.querySelectorAll('input[name="provider"]').forEach((e) => {
            let t = `Minimum amount: ${minAmounts[e.value] || "N/A"}`;
            e.parentElement.setAttribute("title", t), e.parentElement.setAttribute("data-bs-toggle", "tooltip"), e.parentElement.setAttribute("data-bs-placement", "top");
        }),
            document.querySelectorAll('input[name="provider"]').forEach((e) => {
                e.addEventListener("change", function () {
                    let e = this.value,
                        t = document.getElementById("currency");
                    "wert" === e || "stripe" === e || "transfi" === e || "robinhood" === e || "rampnetwork" === e
                        ? (t.value = "USD")
                        : "werteur" === e
                        ? (t.value = "EUR")
                        : "upi" === e
                        ? (t.value = "INR")
                        : "interac" === e
                        ? (t.value = "CAD")
                        : (t.value = "USD");
                    let a = minAmounts[e] || 0,
                        r = document.getElementById("amount");
                    r.setAttribute("min", a),
                        r.setAttribute("placeholder", `Min: ${a}`),
                        document.querySelectorAll(".provider-card").forEach((e) => {
                            e.classList.remove("selected");
                        }),
                        this.closest(".provider-card").classList.add("selected");
                });
            });
        [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]')).map(function (e) {
            return new bootstrap.Tooltip(e);
        }),
            document.querySelectorAll(".provider-item").forEach((e) => {
                e.style.display = "block";
            });
        let a = document.getElementById("provider-search");
        a &&
            a.addEventListener("input", () => {
                let e = a.value.toLowerCase();
                document.querySelectorAll(".provider-item").forEach((t) => {
                    t.querySelector(".provider-name").textContent.toLowerCase().includes(e) ? (t.style.display = "block") : (t.style.display = "none");
                });
            });
        let r = document.getElementById("theme-toggle");
        if (r) {
            let l = localStorage.getItem("theme") || "light";
            document.body.setAttribute("data-bs-theme", l),
                document.body.setAttribute("data-theme", l),
                "dark" === l
                    ? ((r.innerHTML = '<i class="fas fa-sun"></i>'), r.classList.add("btn-outline-light"), r.classList.remove("btn-outline-dark"))
                    : ((r.innerHTML = '<i class="fas fa-moon"></i>'), r.classList.add("btn-outline-dark"), r.classList.remove("btn-outline-light")),
                r.addEventListener("click", () => {
                    let e = "dark" === document.body.getAttribute("data-bs-theme") ? "light" : "dark";
                    document.body.setAttribute("data-bs-theme", e),
                        document.body.setAttribute("data-theme", e),
                        localStorage.setItem("theme", e),
                        "dark" === e
                            ? ((r.innerHTML = '<i class="fas fa-sun"></i>'), r.classList.add("btn-outline-light"), r.classList.remove("btn-outline-dark"))
                            : ((r.innerHTML = '<i class="fas fa-moon"></i>'), r.classList.add("btn-outline-dark"), r.classList.remove("btn-outline-light"));
                });
        }
    });
