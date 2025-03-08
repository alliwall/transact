const FORM_ID="payment-form",WALLET_ADDRESS_ID="wallet_address",AMOUNT_ID="amount",CUSTOMER_EMAIL_ID="customer_email",SUBMIT_BUTTON_ID="submit-btn",SUBMIT_TEXT_ID="submit-text",LOADING_SPINNER_ID="loading-spinner",RESULT_CONTAINER_ID="payment-result",TOAST_CONTAINER=".toast-container",MERCHANT_INFO_ID="merchant-info",CURRENCY_ID="currency",ENCRYPTION_KEY="Transact.st:8a7b6c5d4e3f2g1h",minAmounts={wert:1,werteur:1,guardarian:20,particle:30,robinhood:5,stripe:2,coinbase:2,transak:15,sardine:30,simpleswap:30,banxa:20,utorg:50,simplex:50,changenow:20,transfi:70,alchemypay:5,mercuryo:30,topper:10,swipelux:14,kado:15,unlimit:10,bitnovo:10,rampnetwork:4,upi:100,interac:100,moonpay:20};function validateWalletAddress(e){return/^0x[a-fA-F0-9]{40}$/.test(e)}function validateAmount(e){return!isNaN(e)&&e>0}function validateEmail(e){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}function showToast(e,t="info"){let a=document.querySelector(".toast-container"),l=document.createElement("div");l.className=`toast align-items-center text-white bg-${t} border-0`,l.setAttribute("role","alert"),l.setAttribute("aria-live","assertive"),l.setAttribute("aria-atomic","true"),l.innerHTML=`
    <div class="d-flex">
      <div class="toast-body">
        <i class="fas fa-${"info"===t?"info-circle":"warning"===t?"exclamation-triangle":"success"===t?"check-circle":"exclamation-circle"} me-2"></i>
        ${e}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `,a.appendChild(l);let r=new bootstrap.Toast(l,{delay:3e3});r.show(),l.addEventListener("hidden.bs.toast",()=>{l.remove()})}function toggleLoading(e=!0){let t=document.getElementById("submit-btn"),a=document.getElementById("submit-text"),l=document.getElementById("loading-spinner");e?(t.disabled=!0,a.textContent="Processing...",l.classList.remove("d-none")):(t.disabled=!1,a.textContent="Generate Payment Link",l.classList.add("d-none"))}function copyToClipboard(e){let t=document.createElement("input");t.value=e,document.body.appendChild(t),t.select(),document.execCommand("copy"),document.body.removeChild(t);let a=event.currentTarget,l=bootstrap.Tooltip.getInstance(a);l&&(a.setAttribute("data-bs-original-title","Copied!"),l.update(),setTimeout(()=>{a.setAttribute("data-bs-original-title","Copy to Clipboard"),l.update()},2e3))}function decryptWalletAddress(e){try{let t=e.replace(/-/g,"+").replace(/_/g,"/");for(;t.length%4;)t+="=";let a=atob(t);if(a.startsWith("F1:")){let l=a.split(":");if(4!==l.length)throw Error("Invalid encrypted data format");let r=l[1],n=l[2],s=l[3],i=ENCRYPTION_KEY+r,o=s;for(let d=2;d>=0;d--){let c="";for(let u=0;u<o.length;u++){let m=i.charCodeAt((u*d+u)%i.length),p=u>0?o.charCodeAt(u-1):0,b=o.charCodeAt(u)^m^p>>3;c+=String.fromCharCode(b)}o=c}let y=0;for(let g=0;g<o.length;g++)y=31*y+o.charCodeAt(g)>>>0;if(y.toString(16)!==n)return console.error("Integrity check failed"),null;if(validateWalletAddress(o))return o;return console.error("Decrypted value is not a valid wallet address"),null}{let h=new Uint8Array(a.length);for(let v=0;v<a.length;v++)h[v]=a.charCodeAt(v);let f=h.slice(0,16),E=h.slice(16,48),k=h.slice(48),A=new TextEncoder,w=A.encode(ENCRYPTION_KEY),L=new Uint8Array(256);for(let $=0;$<256;$++)L[$]=$;let I=0;for(let T=0;T<256;T++)I=(I+L[T]+w[T%w.length]+f[T%f.length])%256,[L[T],L[I]]=[L[I],L[T]];let C=new Uint8Array(k.length);for(let S=0;S<k.length;S++){let D=(S+1)%256,x=(L[D]+L[S%256])%256;[L[D],L[x]]=[L[x],L[D]];let _=L[(L[D]+L[x])%256];C[S]=k[S]^_}let B=new Uint8Array(32);for(let N=0;N<32;N++){let P=f[N%f.length];for(let R=0;R<C.length;R++)P^=C[R],P=(P<<1|P>>7)&255;B[N]=P}let U=!0;for(let M=0;M<32;M++)if(E[M]!==B[M]){U=!1;break}if(!U)return console.error("Integrity check failed"),null;let q=new TextDecoder,O=q.decode(C);if(validateWalletAddress(O))return O;return console.error("Decrypted value is not a valid wallet address"),null}}catch(W){return console.error("Decryption error:",W),null}}async function generatePaymentLink(e,t,a,l,r="USD"){let n=`https://paygate.to/payment-link/invoice.php?payment=${Date.now()}_${Math.floor(9e6*Math.random())+1e6}`,s=encodeURIComponent(n),i=await fetch(`https://api.transact.st/control/wallet.php?address=${e}&callback=${s}`);if(!i.ok)throw Error(`Server response error: ${i.status}`);let o=await i.json();if(!o||!o.address_in)return console.error("Error generating payment link"),null;{let d=o.address_in,c=encodeURIComponent(a);return{addressIn:d,paymentLink:`https://payment.transact.st/process-payment.php?address=${d}&amount=${t}&provider=${l}&email=${c}&currency=${r}`,trackingUrl:`https://api.transact.st/control/track.php?address=${d}`}}}async function displayResult(e,t,a,l,r,n,s){let i=document.getElementById(RESULT_CONTAINER_ID);try{let o=parseFloat(t).toFixed(2);new URL(r).searchParams.get("address"),i.innerHTML=`
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
                    <span class="fw-bold fs-5">${o} USDC</span>
                  </div>
                  <div class="mb-2 me-4">
                    <span class="text-muted d-block">Customer Email:</span>
                    <span class="fw-bold">${a}</span>
                  </div>
                  <div class="mb-2">
                    <span class="text-muted d-block">Payment Provider:</span>
                    <span class="fw-bold">${l}</span>
                  </div>
                </div>
                
                <label class="form-label fw-bold">Payment Link:</label>
                <div class="input-group mb-3">
                  <input type="text" class="form-control" value="${r}" id="payment-link" readonly style="background-color: var(--input-background); color: var(--input-text-color);">
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
                  <a href="https://wa.me/?text=${encodeURIComponent(`Complete your payment of ${o} USDC here: ${r}`)}" target="_blank" class="btn btn-success btn-sm" aria-label="Share on WhatsApp">
                    <i class="fab fa-whatsapp me-1"></i> WhatsApp
                  </a>
                  <a href="https://t.me/share/url?url=${encodeURIComponent(r)}&text=${encodeURIComponent(`Complete your payment of ${o} USDC here:`)}" target="_blank" class="btn btn-primary btn-sm" aria-label="Share on Telegram">
                    <i class="fab fa-telegram me-1"></i> Telegram
                  </a>
                  <a href="mailto:${a}?subject=Payment%20Link&body=${encodeURIComponent(`Complete your payment of ${o} USDC here: ${r}`)}" class="btn btn-secondary btn-sm" aria-label="Share by Email">
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
    `,setupCopyButton(),setupTooltips();let d=document.getElementById("copy-link");d&&d.addEventListener("click",()=>{copyToClipboard(r)});let c=document.getElementById("copy-tracking-number");c&&c.addEventListener("click",()=>{copyToClipboard(n)});let u=document.getElementById("copy-tracking-url");u&&u.addEventListener("click",()=>{copyToClipboard(s)});let m=[].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));m.map(function(e){return new bootstrap.Tooltip(e)})}catch(p){console.error("Error displaying result:",p),showToast("Error showing the result. Please try again later.","error")}}function setupCopyButton(){let e=document.getElementById("copy-link");e&&e.addEventListener("click",()=>{let t=document.getElementById("payment-link");t.select(),document.execCommand("copy");let a=bootstrap.Tooltip.getInstance(e);e.setAttribute("data-bs-original-title","Copied!"),a.update(),setTimeout(()=>{e.setAttribute("data-bs-original-title","Copy to Clipboard"),a.update()},2e3)})}function setupTooltips(){let e=[].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));e.map(function(e){return new bootstrap.Tooltip(e)})}async function handleFormSubmission(e){e.preventDefault();let t=document.getElementById(FORM_ID);if(!t.checkValidity()){e.stopPropagation(),t.classList.add("was-validated");return}toggleLoading(!0);try{let a=document.getElementById(WALLET_ADDRESS_ID),l=document.getElementById("amount"),r=document.getElementById("customer_email"),n=document.getElementById("currency"),s=a.value.trim(),i=parseFloat(l.value.trim()),o=r.value.trim(),d=n.value.trim(),c=document.querySelector('input[name="provider"]:checked'),u=c.value,m=parseFloat(c.getAttribute("data-min-amount")||"0");if(!validateWalletAddress(s)){showToast("Invalid wallet address format.","danger"),toggleLoading(!1);return}if(!validateAmount(i)){showToast("Please enter a valid amount. Check the minimum amount for the selected provider.","danger"),toggleLoading(!1);return}if(!validateEmail(o)){showToast("Please enter a valid email address.","danger"),toggleLoading(!1);return}if(i<m){showToast(`Minimum amount for ${u} is ${m} ${d}`,"danger"),toggleLoading(!1);return}let p=await generatePaymentLink(s,i,o,u,d);await displayResult(s,i,o,u,p.paymentLink,p.addressIn,p.trackingUrl);let b=document.getElementById(RESULT_CONTAINER_ID);b.scrollIntoView({behavior:"smooth"})}catch(y){console.error("Error:",y),showToast("An error occurred. Please try again.","danger")}finally{toggleLoading(!1)}}async function processUrlParams(){try{let e=new URLSearchParams(window.location.search),t=e.get("data");if(!t)return showToast("No wallet data provided. Please use a valid payment link.","danger"),!1;let a=await decryptWalletAddress(t);if(!a||!validateWalletAddress(a))return showToast("Invalid or corrupted wallet data. Please use a valid payment link.","danger"),!1;let l=document.getElementById(WALLET_ADDRESS_ID);l.value=a;let r=document.getElementById("merchant-info");return r&&(r.innerHTML="<strong>Merchant Payment:</strong> You are creating a payment link that will send funds to the merchant wallet address shown below. This address is locked and cannot be changed."),!0}catch(n){return console.error("Error processing URL parameters:",n),showToast("Error processing the payment link. Please try again with a valid link.","danger"),!1}}function filterProvidersByCurrency(e){let t=document.querySelectorAll(".provider-item"),a=!1;t.forEach(t=>{let l=t.querySelector('input[name="provider"]'),r=l.getAttribute("data-supported-currency");"ALL"===r||r===e?(t.style.display="block",a||(l.checked=!0,a=!0)):(t.style.display="none",l.checked=!1)})}document.getElementById("currency").addEventListener("change",function(){let e=this.value;filterProvidersByCurrency(e)}),document.querySelectorAll('input[name="provider"]').forEach(e=>{let t=e.value,a;switch(t){case"wert":case"stripe":case"robinhood":case"transfi":case"rampnetwork":a="USD";break;case"werteur":a="EUR";break;case"interac":a="CAD";break;case"upi":a="INR";break;default:a="ALL"}e.setAttribute("data-supported-currency",a)}),document.querySelectorAll('input[name="provider"]').forEach(e=>{e.addEventListener("change",function(){let e=this.value,t=minAmounts[e]||0,a=document.getElementById("amount");a.setAttribute("min",t),a.setAttribute("placeholder",`Min: ${t}`),document.querySelectorAll(".provider-card").forEach(e=>{e.classList.remove("selected")}),this.closest(".provider-card").classList.add("selected")})}),document.addEventListener("DOMContentLoaded",function(){let e=document.getElementById("currency");filterProvidersByCurrency(e.value);let t=[].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));t.map(function(e){return new bootstrap.Tooltip(e)});let a=document.querySelector('input[name="provider"]:checked').value,l=document.getElementById("amount");l.setAttribute("min",minAmounts[a]),l.setAttribute("placeholder",`Min: ${minAmounts[a]}`);let r=document.querySelector('input[name="provider"]:checked').closest(".provider-card");r.classList.add("selected"),document.querySelectorAll(".provider-card").forEach(function(e){e.addEventListener("click",function(e){if("INPUT"!==e.target.tagName){let t=this.querySelector('input[type="radio"]');if(t){t.checked=!0;let a=new Event("change");t.dispatchEvent(a),document.querySelectorAll(".provider-card").forEach(e=>{e.classList.remove("selected")}),this.classList.add("selected")}}})})}),document.addEventListener("DOMContentLoaded",async function(){let e=await processUrlParams();if(!e){let t=document.getElementById(FORM_ID);t&&t.querySelectorAll("input, button").forEach(e=>e.disabled=!0);return}let a=document.getElementById(FORM_ID);a&&a.addEventListener("submit",handleFormSubmission);let l=document.querySelectorAll('input[name="provider"]');l.forEach(e=>{let t=e.value,a=minAmounts[t]||"N/A",l=`Minimum amount: ${a}`;e.parentElement.setAttribute("title",l),e.parentElement.setAttribute("data-bs-toggle","tooltip"),e.parentElement.setAttribute("data-bs-placement","top")}),document.querySelectorAll('input[name="provider"]').forEach(e=>{e.addEventListener("change",function(){let e=this.value,t=document.getElementById("currency");"wert"===e||"stripe"===e||"transfi"===e||"robinhood"===e||"rampnetwork"===e?t.value="USD":"werteur"===e?t.value="EUR":"upi"===e?t.value="INR":"interac"===e?t.value="CAD":t.value="USD";let a=minAmounts[e]||0,l=document.getElementById("amount");l.setAttribute("min",a),l.setAttribute("placeholder",`Min: ${a}`),document.querySelectorAll(".provider-card").forEach(e=>{e.classList.remove("selected")}),this.closest(".provider-card").classList.add("selected")})});let r=[].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));r.map(function(e){return new bootstrap.Tooltip(e)}),document.querySelectorAll(".provider-item").forEach(e=>{e.style.display="block"});let n=document.getElementById("provider-search");n&&n.addEventListener("input",()=>{let e=n.value.toLowerCase(),t=document.querySelectorAll(".provider-item");t.forEach(t=>{let a=t.querySelector(".provider-name").textContent.toLowerCase();a.includes(e)?t.style.display="block":t.style.display="none"})});let s=document.getElementById("theme-toggle");if(s){let i=localStorage.getItem("theme")||"light";document.body.setAttribute("data-bs-theme",i),document.body.setAttribute("data-theme",i),"dark"===i?(s.innerHTML='<i class="fas fa-sun"></i>',s.classList.add("btn-outline-light"),s.classList.remove("btn-outline-dark")):(s.innerHTML='<i class="fas fa-moon"></i>',s.classList.add("btn-outline-dark"),s.classList.remove("btn-outline-light")),s.addEventListener("click",()=>{let e=document.body.getAttribute("data-bs-theme"),t="dark"===e?"light":"dark";document.body.setAttribute("data-bs-theme",t),document.body.setAttribute("data-theme",t),localStorage.setItem("theme",t),"dark"===t?(s.innerHTML='<i class="fas fa-sun"></i>',s.classList.add("btn-outline-light"),s.classList.remove("btn-outline-dark")):(s.innerHTML='<i class="fas fa-moon"></i>',s.classList.add("btn-outline-dark"),s.classList.remove("btn-outline-light"))})}});