const form=document.getElementById("transaction-form"),paymentResult=document.getElementById("payment-result"),submitBtn=document.getElementById("submit-btn"),submitText=document.getElementById("submit-text"),loadingSpinner=document.getElementById("loading-spinner"),themeToggle=document.getElementById("theme-toggle"),themeToggleIcon=themeToggle.querySelector("i"),minAmounts={wert:1,werteur:1,guardarian:20,particle:30,robinhood:5,stripe:2,coinbase:2,transak:15,sardine:30,simpleswap:30,banxa:20,utorg:50,simplex:50,changenow:20,transfi:70,alchemypay:5,mercuryo:30,topper:10,swipelux:14,kado:15,unlimit:10,bitnovo:10,rampnetwork:4,upi:100,interac:100,moonpay:20},savedTheme=localStorage.getItem("theme")||"light";"dark"===savedTheme&&(document.body.setAttribute("data-theme","dark"),document.body.setAttribute("data-bs-theme","dark"),themeToggleIcon.classList.remove("fa-moon"),themeToggleIcon.classList.add("fa-sun")),themeToggle.addEventListener("click",()=>{let e=document.body.getAttribute("data-theme")||"light",t="light"===e?"dark":"light";document.body.setAttribute("data-theme",t),document.body.setAttribute("data-bs-theme",t),localStorage.setItem("theme",t),"dark"===t?(themeToggleIcon.classList.remove("fa-moon"),themeToggleIcon.classList.add("fa-sun")):(themeToggleIcon.classList.remove("fa-sun"),themeToggleIcon.classList.add("fa-moon")),document.dispatchEvent(new CustomEvent("themeChanged",{detail:{theme:t}})),"function"==typeof fixDarkModeStyles&&fixDarkModeStyles()});const providerSearch=document.getElementById("provider-search");function showValidationError(e){let t=document.createElement("div");t.className="alert alert-danger alert-dismissible fade show",t.innerHTML=`
  <i class="fas fa-exclamation-circle me-2"></i>${e}
  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
`,paymentResult.innerHTML="",paymentResult.appendChild(t),paymentResult.classList.add("show"),setTimeout(()=>{t.scrollIntoView({behavior:"smooth",block:"center"})},100)}function startLoading(){submitText.textContent="Processing...",loadingSpinner.classList.remove("d-none"),submitBtn.disabled=!0}function stopLoading(){submitText.textContent="Generate Payment Link",loadingSpinner.classList.add("d-none"),submitBtn.disabled=!1}function copyToClipboard(e,t){navigator.clipboard.writeText(e).then(()=>{let e=t.querySelector(".copy-feedback");e.classList.add("show-feedback"),setTimeout(()=>{e.classList.remove("show-feedback")},2e3)}).catch(e=>{console.error("Error copying: ",e),showToast("Failed to copy to clipboard","danger")})}providerSearch.addEventListener("input",()=>{let e=providerSearch.value.toLowerCase(),t=document.querySelectorAll(".provider-item");t.forEach(t=>{let a=t.querySelector(".provider-name").textContent.toLowerCase();a.includes(e)?t.style.display="block":t.style.display="none"})}),document.querySelectorAll(".provider-item").forEach(e=>{e.style.display="block"}),form.addEventListener("submit",async e=>{if(e.preventDefault(),!form.checkValidity()){e.stopPropagation(),form.classList.add("was-validated");return}let t=document.getElementById("wallet_address").value.trim(),a=document.getElementById("email_address").value.trim(),s=parseFloat(document.getElementById("amount").value),r=document.getElementById("currency"),i=r.value,l=document.querySelector('input[name="provider"]:checked').value,n=/^0x[a-fA-F0-9]{40}$/;if(!n.test(t)){showValidationError("Wallet address must be a valid Ethereum address (0x... format)");return}let o=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;if(!o.test(a)){showValidationError("Please enter a valid email address");return}if(s<minAmounts[l]){showValidationError(`Minimum amount for ${l} is ${minAmounts[l]}`);return}startLoading(),paymentResult.innerHTML="",paymentResult.classList.remove("show");let c=`https://paygate.to/payment-link/invoice.php?payment=${Date.now()}_${Math.floor(9e6*Math.random())+1e6}`,d=encodeURIComponent(c);try{let u=await fetchExternalApi(`https://api.transact.st/control/wallet.php?address=${t}&callback=${d}`);if(!u.ok)throw Error(`Server response error: ${u.status}`);let m=await u.json();if(m&&m.address_in){let p=m.address_in;m.callback_url;let y=encodeURIComponent(a),h=`https://payment.transact.st/process-payment.php?address=${p}&amount=${s}&provider=${l}&email=${y}&currency=${i}`,b=document.createElement("div");b.className="card mb-4 result-card animate-success",b.innerHTML=`
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
        <div class="mb-section">
          <label class="form-label fw-bold">Payment Link:</label>
          <div class="position-relative">
            <div class="copy-link-container">
              <input type="text" class="copy-link-input" value="${h}" readonly style="background-color: var(--input-background); color: var(--input-text-color);">
              <button class="copy-link-button" id="copy-payment-link">
                <i class="fas fa-copy"></i>
                <span class="copy-feedback">Copied!</span>
              </button>
            </div>
          </div>
          <small class="text-muted d-block mt-2">Send this link to your customer to process the payment</small>
        </div>
        
        <div class="tracking-section">
          <h6 class="tracking-section-title mb-3">Transaction Tracking</h6>
          
          <div class="mb-3">
            <label class="form-label fw-semibold">Tracking Number:</label>
            <div class="position-relative">
              <div class="copy-link-container">
                <input type="text" class="copy-link-input" value="${p}" readonly style="background-color: var(--input-background); color: var(--input-text-color);">
                <button class="copy-link-button" id="copy-tracking-number">
                  <i class="fas fa-copy"></i>
                  <span class="copy-feedback">Copied!</span>
                </button>
              </div>
            </div>
            <small class="text-muted d-block mt-2">Use this number to track your payment</small>
          </div>
          
          <div class="mb-3">
            <label class="form-label fw-semibold">Tracking URL:</label>
            <div class="position-relative">
              <div class="copy-link-container">
                <input type="text" class="copy-link-input" value="https://payment.transact.st/control/track.php?address=${p}" readonly style="background-color: var(--input-background); color: var(--input-text-color);">
                <button class="copy-link-button" id="copy-tracking-url">
                  <i class="fas fa-copy"></i>
                  <span class="copy-feedback">Copied!</span>
                </button>
              </div>
            </div>
            <small class="text-muted d-block mt-2">Share this link to monitor the transaction status</small>
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
    `,paymentResult.innerHTML="",paymentResult.appendChild(b),paymentResult.classList.add("show"),document.getElementById("copy-payment-link").addEventListener("click",function(){copyToClipboard(h,this)}),document.getElementById("copy-tracking-number").addEventListener("click",function(){copyToClipboard(p,this)}),document.getElementById("copy-tracking-url").addEventListener("click",function(){copyToClipboard(`https://payment.transact.st/control/track.php?address=${p}`,this)}),document.getElementById("share-payment-link").addEventListener("click",function(){sharePaymentLink(h)}),fixDarkModeStyles(),setTimeout(()=>{b.scrollIntoView({behavior:"smooth",block:"start"})},100),showToast("Payment link generated successfully","success")}else showValidationError("Invalid payment wallet. Please enter a valid USDC (Polygon) wallet address.")}catch(v){console.error("Error:",v),showValidationError(`An error occurred while processing your request: ${v.message}`)}finally{stopLoading()}});const providerInputs=document.querySelectorAll('input[name="provider"]');function showToast(e,t="info"){let a=document.querySelector(".toast-container"),s=document.createElement("div");s.className=`toast align-items-center text-white bg-${t} border-0`,s.setAttribute("role","alert"),s.setAttribute("aria-live","assertive"),s.setAttribute("aria-atomic","true"),s.innerHTML=`
  <div class="d-flex">
    <div class="toast-body">
      <i class="fas fa-${"info"===t?"info-circle":"warning"===t?"exclamation-triangle":"success"===t?"check-circle":"exclamation-circle"} me-2"></i>
      ${e}
    </div>
    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
  </div>
`,a.appendChild(s);let r=new bootstrap.Toast(s,{delay:3e3});r.show(),s.addEventListener("hidden.bs.toast",()=>{s.remove()})}function sharePaymentLink(e){navigator.share?navigator.share({title:"Transact Payment Link",text:"Use this link to make a payment:",url:e}).then(()=>showToast("Link shared successfully","success")).catch(e=>console.log("Error sharing:",e)):(copyToClipboard(e,document.getElementById("copy-payment-link")),showToast("Link copied to clipboard","success"))}function fixDarkModeStyles(){if("dark"===document.body.getAttribute("data-theme")||"dark"===document.body.getAttribute("data-bs-theme")){let e=document.querySelectorAll(".copy-link-input, #payment-link");e.forEach(e=>{e.style.backgroundColor="#1e293b",e.style.color="#f8fafc",e.style.borderColor="#334155"});let t=document.querySelectorAll(".copy-link-container");t.forEach(e=>{e.style.backgroundColor="#1e293b",e.style.borderColor="#334155"});let a=document.querySelectorAll(".card-header .btn-light, .card-header .btn-sm");a.forEach(e=>{e.style.backgroundColor="#334155",e.style.color="#f8fafc",e.style.borderColor="#475569"})}}function filterProvidersByCurrency(e){let t=document.querySelectorAll(".provider-item"),a=!1;t.forEach(t=>{let s=t.querySelector('input[name="provider"]'),r=s.getAttribute("data-supported-currency");"ALL"===r||r===e?(t.style.display="block",a||(s.checked=!0,a=!0)):(t.style.display="none",s.checked=!1)})}providerInputs.forEach(e=>{let t=e.value,a=minAmounts[t]||"N/A",s=`Minimum amount: ${a}`;e.parentElement.setAttribute("title",s),e.parentElement.setAttribute("data-bs-toggle","tooltip"),e.parentElement.setAttribute("data-bs-placement","top")}),document.querySelectorAll('input[name="provider"]').forEach(e=>{e.addEventListener("change",function(){let e=this.value,t=document.getElementById("currency");"wert"===e||"stripe"===e||"transfi"===e||"robinhood"===e||"rampnetwork"===e?t.value="USD":"werteur"===e?t.value="EUR":"upi"===e?t.value="INR":"interac"===e?t.value="CAD":t.value="USD";let a=minAmounts[e]||0,s=document.getElementById("amount");s.setAttribute("min",a),s.setAttribute("placeholder",`Min: ${a}`),document.querySelectorAll(".provider-card").forEach(e=>{e.classList.remove("selected")}),this.closest(".provider-card").classList.add("selected")})}),document.getElementById("amount").addEventListener("change",function(){let e=parseFloat(this.value),t=document.querySelector('input[name="provider"]:checked').value,a=minAmounts[t]||0;e<a?(this.setCustomValidity(`Minimum amount for ${t} is ${a}`),showToast(`Minimum amount for ${t} is ${a}`,"warning")):this.setCustomValidity("")}),document.getElementById("wallet_address").addEventListener("input",function(){let e=this.value.trim();e&&!/^0x[a-fA-F0-9]{40}$/.test(e)?(this.classList.add("is-invalid"),this.setCustomValidity("Invalid wallet address")):(this.classList.remove("is-invalid"),this.setCustomValidity(""))}),document.addEventListener("DOMContentLoaded",function(){let e=[].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));e.map(function(e){return new bootstrap.Tooltip(e)});let t=document.querySelector('input[name="provider"]:checked').value,a=document.getElementById("amount");a.setAttribute("min",minAmounts[t]),a.setAttribute("placeholder",`Min: ${minAmounts[t]}`);let s=document.querySelector('input[name="provider"]:checked').closest(".provider-card");s.classList.add("selected"),window.innerWidth<768&&(document.querySelector(".provider-group").style.maxHeight="200px"),document.querySelectorAll(".provider-card").forEach(function(e){e.addEventListener("click",function(e){if("INPUT"!==e.target.tagName){let t=this.querySelector('input[type="radio"]');if(t){t.checked=!0;let a=new Event("change");t.dispatchEvent(a),document.querySelectorAll(".provider-card").forEach(e=>{e.classList.remove("selected")}),this.classList.add("selected")}}})}),setTimeout(fixDarkModeStyles,100)}),document.addEventListener("themeChanged",fixDarkModeStyles),document.getElementById("currency").addEventListener("change",function(){let e=this.value;filterProvidersByCurrency(e)}),document.querySelectorAll('input[name="provider"]').forEach(e=>{let t=e.value,a;switch(t){case"wert":case"stripe":case"robinhood":case"transfi":case"rampnetwork":a="USD";break;case"werteur":a="EUR";break;case"interac":a="CAD";break;case"upi":a="INR";break;default:a="ALL"}e.setAttribute("data-supported-currency",a)}),document.querySelectorAll('input[name="provider"]').forEach(e=>{e.addEventListener("change",function(){let e=this.value,t=minAmounts[e]||0,a=document.getElementById("amount");a.setAttribute("min",t),a.setAttribute("placeholder",`Min: ${t}`),document.querySelectorAll(".provider-card").forEach(e=>{e.classList.remove("selected")}),this.closest(".provider-card").classList.add("selected")})}),document.addEventListener("DOMContentLoaded",function(){let e=document.getElementById("currency");filterProvidersByCurrency(e.value)});

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