const FORM_ID="generator-form",WALLET_ADDRESS_ID="merchant_wallet_address",SUBMIT_BUTTON_ID="submit-btn",SUBMIT_TEXT_ID="submit-text",LOADING_SPINNER_ID="loading-spinner",RESULT_CONTAINER_ID="generator-result",TOAST_CONTAINER=".toast-container",ENCRYPTION_KEY="Transact.st:8a7b6c5d4e3f2g1h";function validateWalletAddress(e){return/^0x[a-fA-F0-9]{40}$/.test(e)}function decryptWalletAddress(e){try{let t=e.replace(/-/g,"+").replace(/_/g,"/");for(;t.length%4;)t+="=";let a=atob(t);if(a.startsWith("F1:")){let l=a.split(":");if(4!==l.length)throw Error("Invalid encrypted data format");let n=l[1],r=l[2],s=l[3],i=ENCRYPTION_KEY+n,o=s;for(let d=2;d>=0;d--){let c="";for(let p=0;p<o.length;p++){let m=i.charCodeAt((p*d+p)%i.length),u=p>0?o.charCodeAt(p-1):0,b=o.charCodeAt(p)^m^u>>3;c+=String.fromCharCode(b)}o=c}let g=0;for(let y=0;y<o.length;y++)g=31*g+o.charCodeAt(y)>>>0;if(g.toString(16)!==r)return console.error("Integrity check failed"),null;if(validateWalletAddress(o))return o;return console.error("Decrypted value is not a valid wallet address"),null}{let h=new Uint8Array(a.length);for(let f=0;f<a.length;f++)h[f]=a.charCodeAt(f);let v=h.slice(0,16),k=h.slice(16,48),$=h.slice(48),w=new TextEncoder,E=w.encode(ENCRYPTION_KEY),C=new Uint8Array(256);for(let I=0;I<256;I++)C[I]=I;let L=0;for(let T=0;T<256;T++)L=(L+C[T]+E[T%E.length]+v[T%v.length])%256,[C[T],C[L]]=[C[L],C[T]];let A=new Uint8Array($.length);for(let _=0;_<$.length;_++){let x=(_+1)%256,R=(C[x]+C[_%256])%256;[C[x],C[R]]=[C[R],C[x]];let S=C[(C[x]+C[R])%256];A[_]=$[_]^S}let N=new Uint8Array(32);for(let P=0;P<32;P++){let B=v[P%v.length];for(let D=0;D<A.length;D++)B^=A[D],B=(B<<1|B>>7)&255;N[P]=B}let O=!0;for(let W=0;W<32;W++)if(k[W]!==N[W]){O=!1;break}if(!O)return console.error("Integrity check failed"),null;let M=new TextDecoder,U=M.decode(A);if(validateWalletAddress(U))return U;return console.error("Decrypted value is not a valid wallet address"),null}}catch(Y){return console.error("Decryption error:",Y),null}}function showToast(e,t="info"){let a=document.querySelector(".toast-container"),l=document.createElement("div");l.className=`toast align-items-center text-white bg-${t} border-0`,l.setAttribute("role","alert"),l.setAttribute("aria-live","assertive"),l.setAttribute("aria-atomic","true"),l.innerHTML=`
    <div class="d-flex">
      <div class="toast-body">
        <i class="fas fa-${"info"===t?"info-circle":"warning"===t?"exclamation-triangle":"success"===t?"check-circle":"exclamation-circle"} me-2"></i>
        ${e}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `,a.appendChild(l);let n=new bootstrap.Toast(l,{delay:3e3});n.show(),l.addEventListener("hidden.bs.toast",()=>{l.remove()})}function toggleLoading(e=!0){let t=document.getElementById("submit-btn"),a=document.getElementById("submit-text"),l=document.getElementById("loading-spinner");e?(t.disabled=!0,a.classList.add("invisible"),l.classList.remove("d-none")):(t.disabled=!1,a.classList.remove("invisible"),l.classList.add("d-none"))}function encryptWalletAddress(e){try{if(window.crypto&&window.crypto.subtle&&window.crypto.subtle.encrypt){let t=new TextEncoder,a=t.encode(e),l=window.crypto.getRandomValues(new Uint8Array(16)),n=new Uint8Array(256),r=t.encode(ENCRYPTION_KEY);for(let s=0;s<256;s++)n[s]=s;let i=0;for(let o=0;o<256;o++)i=(i+n[o]+r[o%r.length]+l[o%l.length])%256,[n[o],n[i]]=[n[i],n[o]];let d=new Uint8Array(a.length);for(let c=0;c<a.length;c++){let p=(c+1)%256,m=(n[p]+n[c%256])%256;[n[p],n[m]]=[n[m],n[p]];let u=n[(n[p]+n[m])%256];d[c]=a[c]^u}let b=new Uint8Array(32);for(let g=0;g<32;g++){let y=l[g%l.length];for(let h=0;h<a.length;h++)y^=a[h],y=(y<<1|y>>7)&255;b[g]=y}let f=new Uint8Array(l.length+b.length+d.length);f.set(l,0),f.set(b,l.length),f.set(d,l.length+b.length);let v=btoa(String.fromCharCode.apply(null,f));return v.replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}{console.warn("WebCrypto API not fully available, using fallback encryption");let k=Array.from(crypto.getRandomValues(new Uint8Array(16))).map(e=>e.toString(16).padStart(2,"0")).join(""),$=ENCRYPTION_KEY+k,w=e;for(let E=0;E<3;E++){let C="";for(let I=0;I<w.length;I++){let L=$.charCodeAt((I*E+I)%$.length),T=I>0?w.charCodeAt(I-1):0,A=w.charCodeAt(I)^L^T>>3;C+=String.fromCharCode(A)}w=C}let _=0;for(let x=0;x<e.length;x++)_=31*_+e.charCodeAt(x)>>>0;let R=`F1:${k}:${_.toString(16)}:${w}`,S=btoa(R);return S.replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}}catch(N){return console.error("Encryption error:",N),alert("Error encrypting wallet address. Please try again."),null}}async function generatePaymentLink(e){let t=`https://paygate.to/payment-link/invoice.php?payment=${Date.now()}_${Math.floor(9e6*Math.random())+1e6}`,a=encodeURIComponent(t),l=await fetch(`https://api.transact.st/control/wallet.php?address=${decryptWalletAddress(e)}&callback=${a}`);if(!l.ok)throw Error(`Server response error: ${l.status}`);let n=await l.json(),r=window.location.origin;return{addressIn:n.address_in,paymentLink:`${r}/merchant-payment?data=${encodeURIComponent(e)}`,trackingUrl:`https://api.transact.st/control/track.php?address=${n.address_in}`}}function displayResult(e,t){let a=document.getElementById(RESULT_CONTAINER_ID),l=new URL(t),n=l.searchParams.get("data");a.innerHTML=`
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
  `,setupCopyButton(),setupTooltips()}function setupCopyButton(){let e=document.getElementById("copy-link");e&&e.addEventListener("click",()=>{let e=document.getElementById("payment-link");copyToClipboard(e.value)});let t=document.getElementById("copy-tracking-number");t&&t.addEventListener("click",()=>{let e=document.getElementById("tracking-number");copyToClipboard(e.value)});let a=document.getElementById("copy-tracking-url");a&&a.addEventListener("click",()=>{let e=document.getElementById("tracking-url");copyToClipboard(e.value)})}function copyToClipboard(e){let t=document.createElement("input");t.value=e,document.body.appendChild(t),t.select(),document.execCommand("copy"),document.body.removeChild(t);let a=event.currentTarget,l=bootstrap.Tooltip.getInstance(a);l&&(a.setAttribute("data-bs-original-title","Copied!"),l.update(),setTimeout(()=>{a.setAttribute("data-bs-original-title","Copy to Clipboard"),l.update()},2e3))}function setupTooltips(){let e=[].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));e.map(function(e){return new bootstrap.Tooltip(e)})}async function handleFormSubmission(e){e.preventDefault();let t=document.getElementById(FORM_ID);if(!t.checkValidity()){e.stopPropagation(),t.classList.add("was-validated");return}toggleLoading(!0);try{let a=document.getElementById("merchant_wallet_address"),l=a.value.trim();if(!validateWalletAddress(l)){showToast("Please enter a valid wallet address (0x followed by 40 hexadecimal characters).","danger"),toggleLoading(!1);return}let n=await encryptWalletAddress(l);if(!n){showToast("Error encrypting wallet address. Please try again.","danger"),toggleLoading(!1);return}let r=await generatePaymentLink(n);await displayResult(l,r.paymentLink);let s=document.getElementById(RESULT_CONTAINER_ID);s.scrollIntoView({behavior:"smooth"})}catch(i){console.error("Error:",i),showToast("An error occurred. Please try again.","danger")}finally{toggleLoading(!1)}}document.addEventListener("DOMContentLoaded",()=>{let e=document.getElementById(FORM_ID);e&&e.addEventListener("submit",handleFormSubmission);let t=document.getElementById("theme-toggle");if(t){let a=localStorage.getItem("theme")||"light";document.body.setAttribute("data-bs-theme",a),document.body.setAttribute("data-theme",a),"dark"===a?(t.innerHTML='<i class="fas fa-sun"></i>',t.classList.add("btn-outline-light"),t.classList.remove("btn-outline-dark")):(t.innerHTML='<i class="fas fa-moon"></i>',t.classList.add("btn-outline-dark"),t.classList.remove("btn-outline-light")),t.addEventListener("click",()=>{let e=document.body.getAttribute("data-bs-theme"),a="dark"===e?"light":"dark";document.body.setAttribute("data-bs-theme",a),document.body.setAttribute("data-theme",a),localStorage.setItem("theme",a),"dark"===a?(t.innerHTML='<i class="fas fa-sun"></i>',t.classList.add("btn-outline-light"),t.classList.remove("btn-outline-dark")):(t.innerHTML='<i class="fas fa-moon"></i>',t.classList.add("btn-outline-dark"),t.classList.remove("btn-outline-light"))})}});