const FORM_ID="generator-form",WALLET_ADDRESS_ID="merchant_wallet_address",SUBMIT_BUTTON_ID="submit-btn",SUBMIT_TEXT_ID="submit-text",LOADING_SPINNER_ID="loading-spinner",RESULT_CONTAINER_ID="generator-result",TOAST_CONTAINER=".toast-container",ENCRYPTION_KEY="Transact.st:8a7b6c5d4e3f2g1h";function validateWalletAddress(e){return/^0x[a-fA-F0-9]{40}$/.test(e)}function decryptWalletAddress(e){try{let t=e.replace(/-/g,"+").replace(/_/g,"/");for(;t.length%4;)t+="=";let a=atob(t);if(a.startsWith("F1:")){let l=a.split(":");if(4!==l.length)throw Error("Invalid encrypted data format");let n=l[1],r=l[2],s=l[3],i=ENCRYPTION_KEY+n,o=s;for(let d=2;d>=0;d--){let c="";for(let p=0;p<o.length;p++){let m=i.charCodeAt((p*d+p)%i.length),u=p>0?o.charCodeAt(p-1):0,b=o.charCodeAt(p)^m^u>>3;c+=String.fromCharCode(b)}o=c}let g=0;for(let y=0;y<o.length;y++)g=31*g+o.charCodeAt(y)>>>0;if(g.toString(16)!==r)return console.error("Integrity check failed"),null;if(validateWalletAddress(o))return o;return console.error("Decrypted value is not a valid wallet address"),null}{let h=new Uint8Array(a.length);for(let f=0;f<a.length;f++)h[f]=a.charCodeAt(f);let v=h.slice(0,16),k=h.slice(16,48),$=h.slice(48),w=new TextEncoder,E=w.encode(ENCRYPTION_KEY),C=new Uint8Array(256);for(let I=0;I<256;I++)C[I]=I;let L=0;for(let T=0;T<256;T++)L=(L+C[T]+E[T%E.length]+v[T%v.length])%256,[C[T],C[L]]=[C[L],C[T]];let A=new Uint8Array($.length);for(let _=0;_<$.length;_++){let x=(_+1)%256,R=(C[x]+C[_%256])%256;[C[x],C[R]]=[C[R],C[x]];let S=C[(C[x]+C[R])%256];A[_]=$[_]^S}let N=new Uint8Array(32);for(let P=0;P<32;P++){let B=v[P%v.length];for(let D=0;D<A.length;D++)B^=A[D],B=(B<<1|B>>7)&255;N[P]=B}let O=!0;for(let W=0;W<32;W++)if(k[W]!==N[W]){O=!1;break}if(!O)return console.error("Integrity check failed"),null;let M=new TextDecoder,U=M.decode(A);if(validateWalletAddress(U))return U;return console.error("Decrypted value is not a valid wallet address"),null}}catch(Y){return console.error("Decryption error:",Y),null}}function showToast(e,t="info"){let a=document.querySelector(".toast-container"),l=document.createElement("div");l.className=`toast align-items-center text-white bg-${t} border-0`,l.setAttribute("role","alert"),l.setAttribute("aria-live","assertive"),l.setAttribute("aria-atomic","true"),l.innerHTML=`
    <div class="d-flex">
      <div class="toast-body">
        <i class="fas fa-${"info"===t?"info-circle":"warning"===t?"exclamation-triangle":"success"===t?"check-circle":"exclamation-circle"} me-2"></i>
        ${e}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `,a.appendChild(l);let n=new bootstrap.Toast(l,{delay:3e3});n.show(),l.addEventListener("hidden.bs.toast",()=>{l.remove()})}function toggleLoading(e=!0){let t=document.getElementById("submit-btn"),a=document.getElementById("submit-text"),l=document.getElementById("loading-spinner");e?(t.disabled=!0,a.classList.add("invisible"),l.classList.remove("d-none")):(t.disabled=!1,a.classList.remove("invisible"),l.classList.add("d-none"))}function encryptWalletAddress(e){try{if(window.crypto&&window.crypto.subtle&&window.crypto.subtle.encrypt){let t=new TextEncoder,a=t.encode(e),l=window.crypto.getRandomValues(new Uint8Array(16)),n=new Uint8Array(256),r=t.encode(ENCRYPTION_KEY);for(let s=0;s<256;s++)n[s]=s;let i=0;for(let o=0;o<256;o++)i=(i+n[o]+r[o%r.length]+l[o%l.length])%256,[n[o],n[i]]=[n[i],n[o]];let d=new Uint8Array(a.length);for(let c=0;c<a.length;c++){let p=(c+1)%256,m=(n[p]+n[c%256])%256;[n[p],n[m]]=[n[m],n[p]];let u=n[(n[p]+n[m])%256];d[c]=a[c]^u}let b=new Uint8Array(32);for(let g=0;g<32;g++){let y=l[g%l.length];for(let h=0;h<a.length;h++)y^=a[h],y=(y<<1|y>>7)&255;b[g]=y}let f=new Uint8Array(l.length+b.length+d.length);f.set(l,0),f.set(b,l.length),f.set(d,l.length+b.length);let v=btoa(String.fromCharCode.apply(null,f));return v.replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}{console.warn("WebCrypto API not fully available, using fallback encryption");let k=Array.from(crypto.getRandomValues(new Uint8Array(16))).map(e=>e.toString(16).padStart(2,"0")).join(""),$=ENCRYPTION_KEY+k,w=e;for(let E=0;E<3;E++){let C="";for(let I=0;I<w.length;I++){let L=$.charCodeAt((I*E+I)%$.length),T=I>0?w.charCodeAt(I-1):0,A=w.charCodeAt(I)^L^T>>3;C+=String.fromCharCode(A)}w=C}let _=0;for(let x=0;x<e.length;x++)_=31*_+e.charCodeAt(x)>>>0;let R=`F1:${k}:${_.toString(16)}:${w}`,S=btoa(R);return S.replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}}catch(N){return console.error("Encryption error:",N),alert("Error encrypting wallet address. Please try again."),null}}

/**
 * Function to fetch data from external APIs without sending credentials
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} - The fetch response
 */
async function fetchExternalApi(url, options = {}) {
  try {
    // Ensure credentials are explicitly omitted for external requests
    const fetchOptions = {
      ...options,
      credentials: 'omit' // Never send credentials to external domains
    };
    
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.error('External API fetch error:', error);
    throw error;
  }
}

// Payment providers information with categories
const PAYMENT_PROVIDERS = [
  { id: "wert", name: "wert.io", value: "wert", currency: "USD", category: "Credit Card" },
  { id: "werteur", name: "wert.io", value: "werteur", currency: "EUR", category: "Credit Card" },
  { id: "stripe", name: "Stripe", value: "stripe", currency: "USD", category: "Credit Card", tag: "USA Only" },
  { id: "sardine", name: "Sardine.ai", value: "sardine", currency: "ALL", category: "Bank Transfer" },
  { id: "guardarian", name: "Guardarian", value: "guardarian", currency: "ALL", category: "Bank Transfer" },
  { id: "particle", name: "particle.network", value: "particle", currency: "ALL", category: "Crypto Exchange" },
  { id: "transak", name: "Transak", value: "transak", currency: "ALL", category: "Credit Card" },
  { id: "banxa", name: "Banxa", value: "banxa", currency: "ALL", category: "Bank Transfer" },
  { id: "simplex", name: "Simplex", value: "simplex", currency: "ALL", category: "Credit Card" },
  { id: "changenow", name: "ChangeNOW", value: "changenow", currency: "ALL", category: "Crypto Exchange" },
  { id: "mercuryo", name: "mercuryo.io", value: "mercuryo", currency: "ALL", category: "Credit Card" },
  { id: "rampnetwork", name: "ramp.network", value: "rampnetwork", currency: "USD", category: "Bank Transfer" },
  { id: "moonpay", name: "MoonPay", value: "moonpay", currency: "ALL", category: "Credit Card" },
  { id: "alchemypay", name: "Alchemy Pay", value: "alchemypay", currency: "ALL", category: "Bank Transfer" },
  { id: "robinhood", name: "Robinhood", value: "robinhood", currency: "USD", category: "Banking" },
  { id: "coinbase", name: "Coinbase PAY", value: "coinbase", currency: "ALL", category: "Crypto Exchange" },
  { id: "utorg", name: "UTORG", value: "utorg", currency: "ALL", category: "Bank Transfer" },
  { id: "unlimit", name: "Unlimit", value: "unlimit", currency: "ALL", category: "Credit Card" },
  { id: "bitnovo", name: "Bitnovo", value: "bitnovo", currency: "ALL", category: "Bank Transfer" },
  { id: "simpleswap", name: "SimpleSwap", value: "simpleswap", currency: "ALL", category: "Crypto Exchange" },
  { id: "topper", name: "Topper", value: "topper", currency: "ALL", category: "Credit Card" },
  { id: "swipelux", name: "Swipelux", value: "swipelux", currency: "ALL", category: "Bank Transfer" },
  { id: "kado", name: "Kado.money", value: "kado", currency: "ALL", category: "Banking" },
  { id: "itez", name: "Itez", value: "itez", currency: "ALL", category: "Credit Card" },
  { id: "transfi", name: "Transfi", value: "transfi", currency: "USD", category: "Bank Transfer" },
  { id: "interac", name: "Interac", value: "interac", currency: "CAD", category: "Bank Transfer" },
  { id: "upi", name: "UPI/IMPS", value: "upi", currency: "INR", category: "Bank Transfer" }
];

/**
 * Generates checkboxes for selecting payment providers
 */
function generateProviderCheckboxes() {
  const container = document.getElementById("merchant-provider-selection");
  if (!container) return;
  
  // Clear the container
  container.innerHTML = "";
  
  // Group providers by category
  const providersByCategory = {};
  PAYMENT_PROVIDERS.forEach(provider => {
    if (!providersByCategory[provider.category]) {
      providersByCategory[provider.category] = [];
    }
    providersByCategory[provider.category].push(provider);
  });
  
  // Create a header for each category and add providers
  Object.keys(providersByCategory).sort().forEach(category => {
    // Add category header
    const categoryHeader = document.createElement("div");
    categoryHeader.className = "col-12 mt-3 mb-2";
    categoryHeader.innerHTML = `<h6 class="provider-category-title">${category}</h6>`;
    container.appendChild(categoryHeader);
    
    // Add providers for this category
    providersByCategory[category].forEach(provider => {
      const providerCol = document.createElement("div");
      providerCol.className = "col-md-4 col-sm-6 mb-2";
      
      const providerCard = document.createElement("div");
      providerCard.className = "provider-card";
      
      const checkboxDiv = document.createElement("div");
      checkboxDiv.className = "form-check d-flex align-items-center";
      
      const checkboxInput = document.createElement("input");
      checkboxInput.className = "form-check-input merchant-provider-checkbox";
      checkboxInput.type = "checkbox";
      checkboxInput.id = `merchant-${provider.id}`;
      checkboxInput.value = provider.value;
      checkboxInput.dataset.currency = provider.currency;
      checkboxInput.checked = true;
      
      const checkboxLabel = document.createElement("label");
      checkboxLabel.className = "form-check-label ms-2";
      checkboxLabel.htmlFor = `merchant-${provider.id}`;
      
      const labelContent = document.createElement("div");
      labelContent.className = "d-flex flex-column";
      
      const nameSpan = document.createElement("span");
      nameSpan.className = "provider-name";
      nameSpan.textContent = provider.name;
      
      const categorySpan = document.createElement("span");
      categorySpan.className = "provider-category";
      categorySpan.textContent = provider.currency === "ALL" ? "All currencies" : `${provider.currency} only`;
      
      labelContent.appendChild(nameSpan);
      labelContent.appendChild(categorySpan);
      
      if (provider.tag) {
        const tagSpan = document.createElement("span");
        tagSpan.className = "badge bg-warning text-dark ms-1";
        tagSpan.textContent = provider.tag;
        nameSpan.appendChild(tagSpan);
      }
      
      checkboxLabel.appendChild(labelContent);
      checkboxDiv.appendChild(checkboxInput);
      checkboxDiv.appendChild(checkboxLabel);
      
      providerCard.appendChild(checkboxDiv);
      providerCol.appendChild(providerCard);
      
      container.appendChild(providerCol);
    });
  });
  
  // Setup search functionality
  const searchInput = document.getElementById("provider-search");
  if (searchInput) {
    searchInput.addEventListener("input", function() {
      const searchTerm = this.value.toLowerCase();
      document.querySelectorAll("#merchant-provider-selection .col-md-4, #merchant-provider-selection .col-sm-6").forEach(item => {
        const providerName = item.querySelector(".provider-name")?.textContent.toLowerCase();
        if (providerName && providerName.includes(searchTerm)) {
          item.style.display = "block";
        } else {
          item.style.display = "none";
        }
      });
      
      // Show/hide category headers based on visible items
      document.querySelectorAll(".provider-category-title").forEach(header => {
        const categoryName = header.textContent;
        const hasVisibleItems = Array.from(document.querySelectorAll("#merchant-provider-selection .provider-category"))
          .some(category => category.parentElement.parentElement.parentElement.style.display !== "none" && 
                category.closest(".col-md-4, .col-sm-6").style.display !== "none");
        
        header.closest(".col-12").style.display = hasVisibleItems ? "block" : "none";
      });
    });
  }
  
  // Setup select all functionality
  const selectAllBtn = document.getElementById("select-all-providers");
  if (selectAllBtn) {
    selectAllBtn.addEventListener("change", function() {
      const isChecked = this.checked;
      document.querySelectorAll('.merchant-provider-checkbox').forEach(checkbox => {
        checkbox.checked = isChecked;
      });
    });
  }
}

/**
 * Get selected payment providers
 * @returns {Array} Array of selected provider values
 */
function getSelectedProviders() {
  const selectedProviders = [];
  document.querySelectorAll('.merchant-provider-checkbox:checked').forEach(checkbox => {
    selectedProviders.push(checkbox.value);
  });
  return selectedProviders;
}

/**
 * Encrypt data using the same encryption method as wallet addresses
 * @param {string} data - Data to encrypt
 * @returns {string} Encrypted data
 */
function encryptData(data) {
  try {
    if (window.crypto && window.crypto.subtle && window.crypto.subtle.encrypt) {
      // Use WebCrypto API if available (more secure)
      // Similar implementation as encryptWalletAddress but slightly modified
      const encoder = new TextEncoder();
      const dataBytes = encoder.encode(data);
      const iv = window.crypto.getRandomValues(new Uint8Array(16));
      
      const keyBytes = new Uint8Array(256);
      const keyData = encoder.encode(ENCRYPTION_KEY);
      
      for (let i = 0; i < 256; i++) {
        keyBytes[i] = i;
      }
      
      let j = 0;
      for (let i = 0; i < 256; i++) {
        j = (j + keyBytes[i] + keyData[i % keyData.length] + iv[i % iv.length]) % 256;
        [keyBytes[i], keyBytes[j]] = [keyBytes[j], keyBytes[i]];
      }
      
      const encryptedData = new Uint8Array(dataBytes.length);
      for (let i = 0; i < dataBytes.length; i++) {
        const a = (i + 1) % 256;
        const b = (keyBytes[a] + keyBytes[i % 256]) % 256;
        [keyBytes[a], keyBytes[b]] = [keyBytes[b], keyBytes[a]];
        const k = keyBytes[(keyBytes[a] + keyBytes[b]) % 256];
        encryptedData[i] = dataBytes[i] ^ k;
      }
      
      // Create a hash for integrity check
      const hash = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        let h = iv[i % iv.length];
        for (let j = 0; j < dataBytes.length; j++) {
          h ^= dataBytes[j];
          h = ((h << 1) | (h >> 7)) & 0xFF;
        }
        hash[i] = h;
      }
      
      // Combine IV, hash, and encrypted data
      const result = new Uint8Array(iv.length + hash.length + encryptedData.length);
      result.set(iv, 0);
      result.set(hash, iv.length);
      result.set(encryptedData, iv.length + hash.length);
      
      // Convert to base64 and URL-safe format
      let base64 = btoa(String.fromCharCode.apply(null, result));
      return "P1:" + base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } else {
      // Fallback to simpler encryption
      console.warn("WebCrypto API not fully available, using fallback encryption");
      
      // Use a different prefix to distinguish from wallet addresses
      const random = Array.from(crypto.getRandomValues(new Uint8Array(16)))
                      .map(b => b.toString(16).padStart(2, '0'))
                      .join('');
      
      const key = ENCRYPTION_KEY + random;
      let result = data;
      
      // Simple XOR-based encryption
      for (let i = 0; i < 3; i++) {
        let encrypted = "";
        for (let j = 0; j < result.length; j++) {
          const keyChar = key.charCodeAt((j * i + j) % key.length);
          const prevChar = j > 0 ? result.charCodeAt(j - 1) : 0;
          const charCode = result.charCodeAt(j) ^ keyChar ^ (prevChar >> 3);
          encrypted += String.fromCharCode(charCode);
        }
        result = encrypted;
      }
      
      // Calculate checksum
      let checksum = 0;
      for (let i = 0; i < data.length; i++) {
        checksum = ((checksum * 31) + data.charCodeAt(i)) >>> 0;
      }
      
      // Format: P1:<random>:<checksum>:<encrypted>
      const finalString = `P1:${random}:${checksum.toString(16)}:${result}`;
      const base64 = btoa(finalString);
      return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
  } catch (error) {
    console.error("Encryption error:", error);
    return null;
  }
}

/**
 * Decrypt data that was encrypted with encryptData
 * @param {string} encryptedData - Encrypted data
 * @returns {string} Decrypted data
 */
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

/**
 * Generate payment link
 */
function generatePaymentLink() {
  const form = document.getElementById("payment-link-form");

  // Check form validity
  if (!form.checkValidity()) {
    form.classList.add("was-validated");
    showToast("Please fill in all required fields correctly", "warning");
    return;
  }

  // Get form data
  const walletAddress = document.getElementById("wallet_address").value.trim();
  const allowSingle = document.getElementById("allow_single");
  const allowCustomAmount = document.getElementById("allow_custom_amount");
  const fixedAmount = document.getElementById("fixed_amount");
  const customAmount = document.getElementById("custom_amount");
  const customerEmail = document.getElementById("customer_email").value.trim();
  const currency = document.getElementById("currency").value;
  
  // Get list of selected providers
  const selectedProviders = [];
  document.querySelectorAll('.merchant-provider-checkbox:checked').forEach(checkbox => {
    selectedProviders.push(checkbox.value);
  });
  
  // If no providers selected, show error
  if (selectedProviders.length === 0) {
    showToast("Please select at least one payment provider", "warning");
    return;
  }

  // Check wallet address
  if (walletAddress === "") {
    showToast("Please enter a wallet address", "warning");
    return;
  }

  // Check if wallet address is valid
  if (!isValidWalletAddress(walletAddress)) {
    showToast("Please enter a valid Ethereum wallet address", "warning");
    return;
  }

  // Calculate amount
  let amount = "0";
  if (allowCustomAmount.checked) {
    // If custom amount is allowed, it will be entered by the customer
    amount = "";
  } else {
    // Otherwise use the fixed amount
    amount = parseFloat(fixedAmount.value).toFixed(2);
  }

  // Determine if we send to single provider or allow multiple
  let targetPage = "payment.html";
  let selectedProvidersParam = "";
  
  if (allowSingle.checked) {
    // If allowing a single provider to be auto-selected on payment page
    targetPage = "merchant-payment.html";
    // Encrypt the list of allowed providers
    selectedProvidersParam = encryptData(selectedProviders.join(","));
  } else {
    // Multiple providers showing in normal payment page
    // Use only one provider in case they selected just one
    if (selectedProviders.length === 1) {
      // Just one provider, use direct link
      const singleProvider = selectedProviders[0];
      targetPage = "payment.html";
      selectedProvidersParam = singleProvider;
    } else {
      // Multiple providers to show on payment page
      targetPage = "payment.html";
      selectedProvidersParam = selectedProviders.join(",");
    }
  }

  // Generate the base link
  const encryptedWallet = encryptWalletAddress(walletAddress);
  
  let baseLink = `${window.location.origin}/${targetPage}?data=${encodeURIComponent(encryptedWallet)}`;
  
  // Add providers parameter if single provider page
  if (allowSingle.checked) {
    baseLink += `&providers=${encodeURIComponent(selectedProvidersParam)}`;
  } else {
    // For the regular payment page, add as allowed_providers
    baseLink += `&allowed_providers=${encodeURIComponent(selectedProvidersParam)}`;
  }

  // Add fixed amount if needed
  if (!allowCustomAmount.checked && amount !== "") {
    baseLink += `&amount=${amount}`;
  }
  
  // Add currency
  baseLink += `&currency=${currency}`;

  // Add customer email if provided
  if (customerEmail !== "") {
    baseLink += `&email=${encodeURIComponent(customerEmail)}`;
  }

  // Display the result
  displayResult(baseLink);
}

function displayResult(e,t){let a=document.getElementById(RESULT_CONTAINER_ID),l=new URL(t),n=l.searchParams.get("data");a.innerHTML=`
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
                <span class="fw-bold">${e}</span>
              </div>
              
              <div class="alert alert-info mb-4">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Your merchant payment page is ready!</strong> Share this link with your clients and they'll be able to create payment links with your wallet address locked.
              </div>
              
              <label class="form-label fw-bold">Merchant Payment URL:</label>
              <div class="input-group mb-3">
                <input type="text" class="form-control" value="${t}" id="payment-link" readonly style="background-color: var(--input-background); color: var(--input-text-color);">
                <button class="btn btn-outline-secondary" type="button" id="copy-link" data-bs-toggle="tooltip" data-bs-placement="top" title="Copy to Clipboard">
                  <i class="fas fa-copy"></i>
                </button>
              </div>
              <small class="text-muted d-block mb-3">Share this URL with clients who need to create payment links</small>
            </div>
            
            <div class="tracking-section">
              <h6 class="tracking-section-title">Link Tracking</h6>
              
              <div class="mb-3">
                <label class="form-label fw-semibold">Reference Code:</label>
                <div class="input-group mb-2">
                  <input type="text" class="form-control" value="${n}" id="tracking-number" readonly style="background-color: var(--input-background); color: var(--input-text-color);">
                  <button class="btn btn-outline-secondary" type="button" id="copy-tracking-number" data-bs-toggle="tooltip" data-bs-placement="top" title="Copy to Clipboard">
                    <i class="fas fa-copy"></i>
                  </button>
                </div>
                <small class="text-muted d-block">Reference code for this merchant payment page</small>
              </div>
              
              <div class="mb-3">
                <label class="form-label fw-semibold">Tracking URL:</label>
                <div class="input-group mb-2">
                  <input type="text" class="form-control" value="https://payment.transact.st/control/page-status.php?ref=${n}" id="tracking-url" readonly style="background-color: var(--input-background); color: var(--input-text-color);">
                  <button class="btn btn-outline-secondary" type="button" id="copy-tracking-url" data-bs-toggle="tooltip" data-bs-placement="top" title="Copy to Clipboard">
                    <i class="fas fa-copy"></i>
                  </button>
                </div>
                <small class="text-muted d-block">Click here to monitor the page activity.</small>
              </div>
            </div>
            
            <div class="share-buttons mt-4 mb-3">
              <h6 class="mb-2 fw-semibold">Share Payment Page</h6>
              <div class="d-flex flex-wrap gap-2">
                <a href="https://wa.me/?text=${encodeURIComponent(`Use this payment link to process your customer payments: ${t}`)}" target="_blank" class="btn btn-success btn-sm" aria-label="Share on WhatsApp">
                  <i class="fab fa-whatsapp me-1"></i> WhatsApp
                </a>
                <a href="https://t.me/share/url?url=${encodeURIComponent(t)}&text=${encodeURIComponent("Use this payment link to process your customer payments:")}" target="_blank" class="btn btn-primary btn-sm" aria-label="Share on Telegram">
                  <i class="fab fa-telegram me-1"></i> Telegram
                </a>
                <a href="mailto:?subject=Payment%20Link&body=${encodeURIComponent(`Use this payment link to process your customer payments: ${t}`)}" class="btn btn-secondary btn-sm" aria-label="Share by Email">
                  <i class="fas fa-envelope me-1"></i> Email
                </a>
              </div>
            </div>
            
            <div class="d-grid mt-4">
              <a href="${t}" class="btn btn-primary" target="_blank">
                <i class="fas fa-external-link-alt me-2"></i> Open Payment Page
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,setupCopyButton(),setupTooltips()}function setupCopyButton(){let e=document.getElementById("copy-link");e&&e.addEventListener("click",()=>{let e=document.getElementById("payment-link");copyToClipboard(e.value)});let t=document.getElementById("copy-tracking-number");t&&t.addEventListener("click",()=>{let e=document.getElementById("tracking-number");copyToClipboard(e.value)});let a=document.getElementById("copy-tracking-url");a&&a.addEventListener("click",()=>{let e=document.getElementById("tracking-url");copyToClipboard(e.value)})}function copyToClipboard(e){let t=document.createElement("input");t.value=e,document.body.appendChild(t),t.select(),document.execCommand("copy"),document.body.removeChild(t);let a=event.currentTarget,l=bootstrap.Tooltip.getInstance(a);l&&(a.setAttribute("data-bs-original-title","Copied!"),l.update(),setTimeout(()=>{a.setAttribute("data-bs-original-title","Copy to Clipboard"),l.update()},2e3))}function setupTooltips(){let e=[].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));e.map(function(e){return new bootstrap.Tooltip(e)})}async function handleFormSubmission(e){e.preventDefault();let t=document.getElementById(FORM_ID);if(!t.checkValidity()){e.stopPropagation(),t.classList.add("was-validated");return}toggleLoading(!0);try{let a=document.getElementById("merchant_wallet_address"),l=a.value.trim();if(!validateWalletAddress(l)){showToast("Please enter a valid wallet address (0x followed by 40 hexadecimal characters).","danger"),toggleLoading(!1);return}let n=await encryptWalletAddress(l);if(!n){showToast("Error encrypting wallet address. Please try again.","danger"),toggleLoading(!1);return}let r=await generatePaymentLink(n);await displayResult(l,r.paymentLink);let s=document.getElementById(RESULT_CONTAINER_ID);s.scrollIntoView({behavior:"smooth"})}catch(i){console.error("Error:",i),showToast("An error occurred. Please try again.","danger")}finally{toggleLoading(!1)}}document.addEventListener("DOMContentLoaded", () => {
    // Generate provider checkboxes
    generateProviderCheckboxes();
    
    // Setup form submission
    let e = document.getElementById(FORM_ID);
    e && e.addEventListener("submit", handleFormSubmission);
    
    // Setup theme toggle
    let t = document.getElementById("theme-toggle");
    if (t) {
        let a = localStorage.getItem("theme") || "light";
        document.body.setAttribute("data-bs-theme", a);
        document.body.setAttribute("data-theme", a);
        if ("dark" === a) {
            t.innerHTML = '<i class="fas fa-sun"></i>';
            t.classList.add("btn-outline-light");
            t.classList.remove("btn-outline-dark");
        } else {
            t.innerHTML = '<i class="fas fa-moon"></i>';
            t.classList.add("btn-outline-dark");
            t.classList.remove("btn-outline-light");
        }
        
        t.addEventListener("click", () => {
            let e = document.body.getAttribute("data-bs-theme"),
                a = "dark" === e ? "light" : "dark";
            document.body.setAttribute("data-bs-theme", a);
            document.body.setAttribute("data-theme", a);
            localStorage.setItem("theme", a);
            
            if ("dark" === a) {
                t.innerHTML = '<i class="fas fa-sun"></i>';
                t.classList.add("btn-outline-light");
                t.classList.remove("btn-outline-dark");
            } else {
                t.innerHTML = '<i class="fas fa-moon"></i>';
                t.classList.add("btn-outline-dark");
                t.classList.remove("btn-outline-light");
            }
        });
    }
    
    // Setup provider search
    const searchInput = document.getElementById("provider-search");
    if (searchInput) {
        searchInput.addEventListener("input", function() {
            const searchTerm = this.value.toLowerCase();
            const providerItems = document.querySelectorAll("#merchant-provider-selection .col-md-4, #merchant-provider-selection .col-sm-6");
            
            providerItems.forEach(item => {
                if (!item.querySelector(".provider-name")) return;
                
                const providerName = item.querySelector(".provider-name").textContent.toLowerCase();
                if (providerName.includes(searchTerm)) {
                    item.style.display = "block";
                } else {
                    item.style.display = "none";
                }
            });
            
            // Show/hide category headers
            document.querySelectorAll(".provider-category-title").forEach(header => {
                const categoryElement = header.closest(".col-12");
                const nextElement = categoryElement.nextElementSibling;
                let hasVisibleItems = false;
                
                // Check if any provider in this category is visible
                let current = nextElement;
                while (current && !current.classList.contains("col-12")) {
                    if (current.style.display !== "none") {
                        hasVisibleItems = true;
                        break;
                    }
                    current = current.nextElementSibling;
                }
                
                categoryElement.style.display = hasVisibleItems ? "block" : "none";
            });
        });
    }
});