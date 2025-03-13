const form=document.getElementById("transaction-form"),paymentResult=document.getElementById("payment-result"),submitBtn=document.getElementById("submit-btn"),submitText=document.getElementById("submit-text"),loadingSpinner=document.getElementById("loading-spinner"),themeToggle=document.getElementById("theme-toggle"),themeToggleIcon=themeToggle.querySelector("i"),minAmounts={wert:1,werteur:1,guardarian:20,particle:30,robinhood:5,stripe:2,coinbase:2,transak:15,sardine:30,simpleswap:30,banxa:20,utorg:50,simplex:50,changenow:20,transfi:70,alchemypay:5,mercuryo:30,topper:10,swipelux:14,kado:15,unlimit:10,bitnovo:10,rampnetwork:4,upi:100,interac:100,moonpay:20},savedTheme=localStorage.getItem("theme")||"light";"dark"===savedTheme&&(document.body.setAttribute("data-theme","dark"),document.body.setAttribute("data-bs-theme","dark"),themeToggleIcon.classList.remove("fa-moon"),themeToggleIcon.classList.add("fa-sun")),themeToggle.addEventListener("click",()=>{let e="light"===(document.body.getAttribute("data-theme")||"light")?"dark":"light";document.body.setAttribute("data-theme",e),document.body.setAttribute("data-bs-theme",e),localStorage.setItem("theme",e),"dark"===e?(themeToggleIcon.classList.remove("fa-moon"),themeToggleIcon.classList.add("fa-sun")):(themeToggleIcon.classList.remove("fa-sun"),themeToggleIcon.classList.add("fa-moon")),document.dispatchEvent(new CustomEvent("themeChanged",{detail:{theme:e}})),"function"==typeof fixDarkModeStyles&&fixDarkModeStyles()});const providerSearch=document.getElementById("provider-search");function showValidationError(e){let t=document.createElement("div");t.className="alert alert-danger alert-dismissible fade show",t.innerHTML=`
  <i class="fas fa-exclamation-circle me-2"></i>${e}
  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
`,paymentResult.innerHTML="",paymentResult.appendChild(t),paymentResult.classList.add("show"),setTimeout(()=>{t.scrollIntoView({behavior:"smooth",block:"center"})},100)}function startLoading(){submitText.textContent="Processing...",loadingSpinner.classList.remove("d-none"),submitBtn.disabled=!0}function stopLoading(){submitText.textContent="Generate Payment Link",loadingSpinner.classList.add("d-none"),submitBtn.disabled=!1}function copyToClipboard(e,t){navigator.clipboard.writeText(e).then(()=>{let e=t.querySelector(".copy-feedback");e.classList.add("show-feedback"),setTimeout(()=>{e.classList.remove("show-feedback")},2e3)}).catch(e=>{console.error("Error copying: ",e),showToast("Failed to copy to clipboard","danger")})}providerSearch.addEventListener("input",()=>{let e=providerSearch.value.toLowerCase();document.querySelectorAll(".provider-item").forEach(t=>{t.querySelector(".provider-name").textContent.toLowerCase().includes(e)?t.style.display="block":t.style.display="none"})}),document.querySelectorAll(".provider-item").forEach(e=>{e.style.display="block"}),form.addEventListener("submit",async e=>{if(e.preventDefault(),!form.checkValidity()){e.stopPropagation(),form.classList.add("was-validated");return}let t=document.getElementById("wallet_address").value.trim(),a=document.getElementById("email_address").value.trim(),s=parseFloat(document.getElementById("amount").value),r=document.getElementById("currency").value,i=document.querySelector('input[name="provider"]:checked').value;if(!/^0x[a-fA-F0-9]{40}$/.test(t)){showValidationError("Wallet address must be a valid Ethereum address (0x... format)");return}if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a)){showValidationError("Please enter a valid email address");return}if(s<minAmounts[i]){showValidationError(`Minimum amount for ${i} is ${minAmounts[i]}`);return}startLoading(),paymentResult.innerHTML="",paymentResult.classList.remove("show");let n=encodeURIComponent(`https://paygate.to/payment-link/invoice.php?payment=${Date.now()}_${Math.floor(9e6*Math.random())+1e6}`);try{let l=await fetchExternalApi(`https://api.transact.st/control/wallet.php?address=${t}&callback=${n}`);if(!l.ok)throw Error(`Server response error: ${l.status}`);let o=await l.json();if(o&&o.address_in){let c=o.address_in;o.callback_url;let d=`https://payment.transact.st/process-payment.php?address=${c}&amount=${s}&provider=${i}&email=${encodeURIComponent(a)}&currency=${r}`,u=document.createElement("div");u.className="card mb-4 result-card animate-success",u.innerHTML=`
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
              <input type="text" class="copy-link-input" value="${d}" readonly style="background-color: var(--input-background); color: var(--input-text-color);">
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
                <input type="text" class="copy-link-input" value="${c}" readonly style="background-color: var(--input-background); color: var(--input-text-color);">
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
                <input type="text" class="copy-link-input" value="https://payment.transact.st/control/track.php?address=${c}" readonly style="background-color: var(--input-background); color: var(--input-text-color);">
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
    `,paymentResult.innerHTML="",paymentResult.appendChild(u),paymentResult.classList.add("show"),document.getElementById("copy-payment-link").addEventListener("click",function(){copyToClipboard(d,this)}),document.getElementById("copy-tracking-number").addEventListener("click",function(){copyToClipboard(c,this)}),document.getElementById("copy-tracking-url").addEventListener("click",function(){copyToClipboard(`https://payment.transact.st/control/track.php?address=${c}`,this)}),document.getElementById("share-payment-link").addEventListener("click",function(){sharePaymentLink(d,r,s)}),fixDarkModeStyles(),setTimeout(()=>{u.scrollIntoView({behavior:"smooth",block:"start"})},100),showToast("Payment link generated successfully","success")}else showValidationError("Invalid payment wallet. Please enter a valid wallet address.")}catch(m){console.error("Error:",m),showValidationError(`An error occurred while processing your request: ${m.message}`)}finally{stopLoading()}});const providerInputs=document.querySelectorAll('input[name="provider"]');function showToast(e,t="info"){let a=document.querySelector(".toast-container"),s=document.createElement("div");s.className=`toast align-items-center text-white bg-${t} border-0`,s.setAttribute("role","alert"),s.setAttribute("aria-live","assertive"),s.setAttribute("aria-atomic","true"),s.innerHTML=`
  <div class="d-flex">
    <div class="toast-body">
      <i class="fas fa-${"info"===t?"info-circle":"warning"===t?"exclamation-triangle":"success"===t?"check-circle":"exclamation-circle"} me-2"></i>
      ${e}
    </div>
    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
  </div>
`,a.appendChild(s);new bootstrap.Toast(s,{delay:3e3}).show(),s.addEventListener("hidden.bs.toast",()=>{s.remove()})}function sharePaymentLink(e,t="USD",a=0){navigator.share?navigator.share({title:"Transact Payment Link",text:`Use this link to make a payment of ${a} ${t}:`,url:e}).then(()=>showToast("Link shared successfully","success")).catch(e=>console.log("Error sharing:",e)):(copyToClipboard(e,document.getElementById("copy-payment-link")),showToast("Link copied to clipboard","success"))}function fixDarkModeStyles(){if("dark"===document.body.getAttribute("data-theme")||"dark"===document.body.getAttribute("data-bs-theme")){document.querySelectorAll(".copy-link-input, #payment-link").forEach(e=>{e.style.backgroundColor="#1e293b",e.style.color="#f8fafc",e.style.borderColor="#334155"});document.querySelectorAll(".copy-link-container").forEach(e=>{e.style.backgroundColor="#1e293b",e.style.borderColor="#334155"});document.querySelectorAll(".card-header .btn-light, .card-header .btn-sm").forEach(e=>{e.style.backgroundColor="#334155",e.style.color="#f8fafc",e.style.borderColor="#475569"})}}function filterProvidersByCurrency(e){let t=document.querySelectorAll(".provider-item"),a=!1;t.forEach(t=>{let s=t.querySelector('input[name="provider"]'),r=s.getAttribute("data-supported-currency");"ALL"===r||r===e?(t.style.display="block",a||(s.checked=!0,a=!0)):(t.style.display="none",s.checked=!1)})}async function fetchExternalApi(e,t={}){try{let a={...t,credentials:"omit"},s=await fetch(e,a);if(!s.ok)throw Error(`API request failed with status: ${s.status}`);return s}catch(r){throw console.error("External API fetch error:",r),r}}providerInputs.forEach(e=>{let t=`Minimum amount: ${minAmounts[e.value]||"N/A"}`;e.parentElement.setAttribute("title",t),e.parentElement.setAttribute("data-bs-toggle","tooltip"),e.parentElement.setAttribute("data-bs-placement","top")}),document.querySelectorAll('input[name="provider"]').forEach(e=>{e.addEventListener("change",function(){let e=this.value,t=document.getElementById("currency");"wert"===e||"stripe"===e||"transfi"===e||"robinhood"===e||"rampnetwork"===e?t.value="USD":"werteur"===e?t.value="EUR":"upi"===e?t.value="INR":"interac"===e?t.value="CAD":t.value="USD";let a=minAmounts[e]||0,s=document.getElementById("amount");s.setAttribute("min",a),s.setAttribute("placeholder",`Min: ${a}`),document.querySelectorAll(".provider-card").forEach(e=>{e.classList.remove("selected")}),this.closest(".provider-card").classList.add("selected")})}),document.getElementById("amount").addEventListener("change",function(){let e=parseFloat(this.value),t=document.querySelector('input[name="provider"]:checked').value,a=minAmounts[t]||0;e<a?(this.setCustomValidity(`Minimum amount for ${t} is ${a}`),showToast(`Minimum amount for ${t} is ${a}`,"warning")):this.setCustomValidity("")}),document.getElementById("wallet_address").addEventListener("input",function(){let e=this.value.trim();e&&!/^0x[a-fA-F0-9]{40}$/.test(e)?(this.classList.add("is-invalid"),this.setCustomValidity("Invalid wallet address")):(this.classList.remove("is-invalid"),this.setCustomValidity(""))}),document.addEventListener("DOMContentLoaded",function(){[].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]')).map(function(e){return new bootstrap.Tooltip(e)});let e=document.querySelector('input[name="provider"]:checked').value,t=document.getElementById("amount");t.setAttribute("min",minAmounts[e]),t.setAttribute("placeholder",`Min: ${minAmounts[e]}`);document.querySelector('input[name="provider"]:checked').closest(".provider-card").classList.add("selected"),window.innerWidth<768&&(document.querySelector(".provider-group").style.maxHeight="200px"),document.querySelectorAll(".provider-card").forEach(function(e){e.addEventListener("click",function(e){if("INPUT"!==e.target.tagName){let t=this.querySelector('input[type="radio"]');if(t){t.checked=!0;let a=new Event("change");t.dispatchEvent(a),document.querySelectorAll(".provider-card").forEach(e=>{e.classList.remove("selected")}),this.classList.add("selected")}}})}),setTimeout(fixDarkModeStyles,100)}),document.addEventListener("themeChanged",fixDarkModeStyles),document.getElementById("currency").addEventListener("change",function(){filterProvidersByCurrency(this.value)}),document.querySelectorAll('input[name="provider"]').forEach(e=>{let t=e.value,a;switch(t){case"wert":case"stripe":case"robinhood":case"transfi":case"rampnetwork":a="USD";break;case"werteur":a="EUR";break;case"interac":a="CAD";break;case"upi":a="INR";break;default:a="ALL"}e.setAttribute("data-supported-currency",a)}),document.querySelectorAll('input[name="provider"]').forEach(e=>{e.addEventListener("change",function(){let e=minAmounts[this.value]||0,t=document.getElementById("amount");t.setAttribute("min",e),t.setAttribute("placeholder",`Min: ${e}`),document.querySelectorAll(".provider-card").forEach(e=>{e.classList.remove("selected")}),this.closest(".provider-card").classList.add("selected")})}),document.addEventListener("DOMContentLoaded",function(){filterProvidersByCurrency(document.getElementById("currency").value)});