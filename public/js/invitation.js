document.addEventListener("DOMContentLoaded", function () {
  let e = document.querySelector(".theme-switch"),
      t = document.documentElement,
      a = localStorage.getItem("theme") || "dark";
  t.setAttribute("data-bs-theme", a),
      "light" === a && e.classList.add("light"),
      e.addEventListener("click", function () {
          let e = "dark" === t.getAttribute("data-bs-theme") ? "light" : "dark";
          t.setAttribute("data-bs-theme", e), localStorage.setItem("theme", e), this.classList.toggle("light");
      });
  let n = document.getElementById("invitation-code-section"),
      i = document.getElementById("request-form-section"),
      r = document.getElementById("request-invitation-btn"),
      l = document.getElementById("back-to-invitation"),
      o = document.getElementById("invitation-form"),
      s = document.getElementById("request-form"),
      d = document.getElementById("success-message"),
      u = document.getElementById("error-message");
  !(function e(t) {
      let a = [
              "Afghanistan",
              "Albania",
              "Algeria",
              "Andorra",
              "Angola",
              "Antigua and Barbuda",
              "Argentina",
              "Armenia",
              "Australia",
              "Austria",
              "Azerbaijan",
              "Bahamas",
              "Bahrain",
              "Bangladesh",
              "Barbados",
              "Belarus",
              "Belgium",
              "Belize",
              "Benin",
              "Bhutan",
              "Bolivia",
              "Bosnia and Herzegovina",
              "Botswana",
              "Brazil",
              "Brunei",
              "Bulgaria",
              "Burkina Faso",
              "Burundi",
              "Cabo Verde",
              "Cambodia",
              "Cameroon",
              "Canada",
              "Central African Republic",
              "Chad",
              "Chile",
              "China",
              "Colombia",
              "Comoros",
              "Congo",
              "Costa Rica",
              "Croatia",
              "Cuba",
              "Cyprus",
              "Czech Republic",
              "Denmark",
              "Djibouti",
              "Dominica",
              "Dominican Republic",
              "East Timor",
              "Ecuador",
              "Egypt",
              "El Salvador",
              "Equatorial Guinea",
              "Eritrea",
              "Estonia",
              "Eswatini",
              "Ethiopia",
              "Fiji",
              "Finland",
              "France",
              "Gabon",
              "Gambia",
              "Georgia",
              "Germany",
              "Ghana",
              "Greece",
              "Grenada",
              "Guatemala",
              "Guinea",
              "Guinea-Bissau",
              "Guyana",
              "Haiti",
              "Honduras",
              "Hungary",
              "Iceland",
              "India",
              "Indonesia",
              "Iran",
              "Iraq",
              "Ireland",
              "Israel",
              "Italy",
              "Jamaica",
              "Japan",
              "Jordan",
              "Kazakhstan",
              "Kenya",
              "Kiribati",
              "Korea, North",
              "Korea, South",
              "Kosovo",
              "Kuwait",
              "Kyrgyzstan",
              "Laos",
              "Latvia",
              "Lebanon",
              "Lesotho",
              "Liberia",
              "Libya",
              "Liechtenstein",
              "Lithuania",
              "Luxembourg",
              "Madagascar",
              "Malawi",
              "Malaysia",
              "Maldives",
              "Mali",
              "Malta",
              "Marshall Islands",
              "Mauritania",
              "Mauritius",
              "Mexico",
              "Micronesia",
              "Moldova",
              "Monaco",
              "Mongolia",
              "Montenegro",
              "Morocco",
              "Mozambique",
              "Myanmar",
              "Namibia",
              "Nauru",
              "Nepal",
              "Netherlands",
              "New Zealand",
              "Nicaragua",
              "Niger",
              "Nigeria",
              "North Macedonia",
              "Norway",
              "Oman",
              "Pakistan",
              "Palau",
              "Palestine",
              "Panama",
              "Papua New Guinea",
              "Paraguay",
              "Peru",
              "Philippines",
              "Poland",
              "Portugal",
              "Qatar",
              "Romania",
              "Russia",
              "Rwanda",
              "Saint Kitts and Nevis",
              "Saint Lucia",
              "Saint Vincent and the Grenadines",
              "Samoa",
              "San Marino",
              "Sao Tome and Principe",
              "Saudi Arabia",
              "Senegal",
              "Serbia",
              "Seychelles",
              "Sierra Leone",
              "Singapore",
              "Slovakia",
              "Slovenia",
              "Solomon Islands",
              "Somalia",
              "South Africa",
              "South Sudan",
              "Spain",
              "Sri Lanka",
              "Sudan",
              "Suriname",
              "Sweden",
              "Switzerland",
              "Syria",
              "Taiwan",
              "Tajikistan",
              "Tanzania",
              "Thailand",
              "Togo",
              "Tonga",
              "Trinidad and Tobago",
              "Tunisia",
              "Turkey",
              "Turkmenistan",
              "Tuvalu",
              "Uganda",
              "Ukraine",
              "United Arab Emirates",
              "United Kingdom",
              "United States",
              "Uruguay",
              "Uzbekistan",
              "Vanuatu",
              "Vatican City",
              "Venezuela",
              "Vietnam",
              "Yemen",
              "Zambia",
              "Zimbabwe",
          ],
          n = t.querySelector('optgroup[label="Countries"]');
      if (!n) {
          console.error("Countries optgroup not found");
          return;
      }
      a.sort(),
          a.forEach((e) => {
              let t = document.createElement("option");
              (t.value = e), (t.textContent = e), n.appendChild(t);
          });
  })(document.getElementById("country"));
  let c = document.getElementById("referral-source"),
      y = document.getElementById("other-referral-container"),
      m = document.getElementById("other-referral"),
      g = document.getElementById("other-referral-char-count");
  function p(e) {
      let t = document.getElementById("verify-code-btn"),
          a = document.getElementById("verify-spinner"),
          n = document.getElementById("verify-text");
      e ? ((t.disabled = !0), a.classList.remove("d-none"), (n.textContent = "Verifying...")) : ((t.disabled = !1), a.classList.add("d-none"), (n.textContent = "Submit"));
  }
  function h(e) {
      let t = document.getElementById("submit-request-btn"),
          a = document.getElementById("submit-spinner"),
          n = document.getElementById("submit-text"),
          i = document.getElementById("back-to-invitation");
      e ? ((t.disabled = !0), (i.disabled = !0), a.classList.remove("d-none"), (n.textContent = "Processing...")) : ((t.disabled = !1), (i.disabled = !1), a.classList.add("d-none"), (n.textContent = "Submit Request"));
  }
  function b(e) {
      (u.textContent = e), (u.style.display = "block"), (d.style.display = "none"), u.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  c.addEventListener("change", function () {
      "Other" === this.value ? ((y.style.display = "block"), (m.required = !0)) : ((y.style.display = "none"), (m.required = !1));
  }),
      m.addEventListener("input", function () {
          let e = this.value.length;
          (g.textContent = e), e >= 500 ? g.classList.add("text-danger") : g.classList.remove("text-danger");
      }),
      r.addEventListener("click", function () {
          (n.style.display = "none"), (i.style.display = "block"), (d.style.display = "none"), (u.style.display = "none");
      }),
      l.addEventListener("click", function () {
          (i.style.display = "none"), (n.style.display = "block"), (d.style.display = "none"), (u.style.display = "none");
      }),
      o.addEventListener("submit", async function (e) {
          e.preventDefault();
          let t = document.getElementById("invitation-code").value.trim();
          if (!t) {
              b("Please enter an invitation code");
              return;
          }
          p(!0);
          try {
              let a = await (await fetch("/api/session-status", { method: "GET", credentials: "include" })).json();
              console.log("Current session before verification:", a);
              let n = await fetch("/api/invitation/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: t }), credentials: "include" }),
                  i = await n.json();
              if ((console.log("Verification response:", i), n.ok)) {
                  (d.innerHTML = `
        <div class="d-flex align-items-center">
          <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          <span>Checking your invitation code...</span>
        </div>
      `),
                      (d.style.display = "block"),
                      (u.style.display = "none");
                  let r = await (await fetch("/api/session-status", { method: "GET", credentials: "include" })).json();
                  console.log("Session after verification:", r);
                  let l = new URLSearchParams(window.location.search).get("redirect_url") || "/";
                  (d.innerHTML = `
        <div class="d-flex align-items-center">
          <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          <span>Invitation code verified! Redirecting you...</span>
        </div>
      `),
                      setTimeout(() => {
                          try {
                              (window.location.href = l),
                                  setTimeout(() => {
                                      try {
                                          window.location.replace(l),
                                              setTimeout(() => {
                                                  try {
                                                      let e = document.createElement("a");
                                                      (e.href = l), (e.style.display = "none"), document.body.appendChild(e), e.click();
                                                  } catch (t) {
                                                      console.error("Redirect method 3 failed:", t),
                                                          (d.innerHTML = `
                    <div class="alert alert-success">
                      <p>Invitation code verified successfully!</p>
                      <p>Please <a href="${l}" class="alert-link">click here</a> to continue.</p>
                    </div>
                  `);
                                                  }
                                              }, 500);
                                      } catch (e) {
                                          console.error("Redirect method 2 failed:", e);
                                      }
                                  }, 500);
                          } catch (e) {
                              console.error("Redirect method 1 failed:", e);
                          }
                      }, 1500);
              } else p(!1), (u.textContent = i.error || "Failed to verify invitation code"), (u.style.display = "block"), (d.style.display = "none");
          } catch (o) {
              p(!1), console.error("Fetch error:", o), (u.textContent = "An error occurred. Please try again."), (u.style.display = "block"), (d.style.display = "none");
          }
      }),
      s.addEventListener("submit", async function (e) {
          if (
              (e.preventDefault(),
              !(function e() {
                  if (!document.getElementById("email").value.trim()) return b("Email address is required"), !1;
                  let t = document.getElementById("telegram").value.trim(),
                      a = document.getElementById("whatsapp").value.trim();
                  return t && !/^[a-zA-Z0-9_]{5,32}$/.test(t)
                      ? (b("Telegram handle must be 5-32 characters and contain only letters, numbers, and underscores"), !1)
                      : a && !/^[+0-9]+$/.test(a)
                      ? (b("WhatsApp number must contain only numbers and optionally a + sign"), !1)
                      : !!("Other" !== document.getElementById("referral-source").value || document.getElementById("other-referral").value.trim()) || (b("Please specify how you heard about Transact"), !1);
              })())
          )
              return;
          h(!0);
          let t = document.getElementById("referral-source").value;
          "Other" === t && (t = document.getElementById("other-referral").value.trim());
          let a = document.getElementById("country").value,
              r = {
                  email: document.getElementById("email").value.trim(),
                  telegram_handle: document.getElementById("telegram").value.trim() || null,
                  whatsapp: document.getElementById("whatsapp").value.trim() || null,
                  name: document.getElementById("name").value.trim() || null,
                  country: a || null,
                  daily_volume: document.getElementById("daily-volume").value || null,
                  referral_source: t || null,
              };
          try {
              let l = await fetch("/api/invitation/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(r), credentials: "include" }),
                  o = await l.json();
              l.ok
                  ? ((d.textContent = "Your invitation request has been submitted successfully. We will contact you soon."),
                    (d.style.display = "block"),
                    (u.style.display = "none"),
                    setTimeout(() => {
                        h(!1), s.reset(), (i.style.display = "none"), (n.style.display = "block"), (y.style.display = "none");
                    }, 1e3))
                  : (h(!1), (u.textContent = o.error || "Failed to submit invitation request"), (u.style.display = "block"), (d.style.display = "none"));
          } catch (c) {
              h(!1), (u.textContent = "An error occurred. Please try again."), (u.style.display = "block"), (d.style.display = "none");
          }
      });
});
