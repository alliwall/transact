document.addEventListener("DOMContentLoaded", function () {
  let e = document.getElementById("login-section"),
    t = document.getElementById("admin-dashboard"),
    n = document.getElementById("login-form"),
    a = document.getElementById("login-error"),
    s = document.getElementById("logout-btn"),
    i = document.getElementById("nav-requests"),
    d = document.getElementById("nav-codes"),
    r = document.getElementById("nav-item-requests"),
    l = document.getElementById("nav-item-codes"),
    o = document.getElementById("requests-section"),
    c = document.getElementById("codes-section"),
    u = document.getElementById("refresh-requests"),
    y = document.getElementById("refresh-codes"),
    m = document.getElementById("requests-table-body");
  document.getElementById("codes-table-body");
  let g = document.getElementById("no-requests");
  document.getElementById("no-codes");
  let p = new bootstrap.Modal(document.getElementById("approve-modal")),
    h = document.getElementById("confirm-approve"),
    b = document.querySelector(".theme-switch"),
    v = document.documentElement,
    f = document.getElementById("pending-count"),
    E = document.getElementById("approved-count"),
    k = document.getElementById("rejected-count"),
    L = localStorage.getItem("adminToken"),
    w = localStorage.getItem("theme") || "dark";
  function B() {
    (e.style.display = "block"),
      (t.style.display = "none"),
      (a.style.display = "none"),
      (s.style.display = "none"),
      (r.style.display = "none"),
      (l.style.display = "none");
  }
  function I() {
    (e.style.display = "none"),
      (t.style.display = "block"),
      (s.style.display = "block"),
      (r.style.display = "block"),
      (l.style.display = "block");
  }
  function q() {
    (o.style.display = "block"),
      (c.style.display = "none"),
      i.classList.add("active"),
      d.classList.remove("active");
  }
  function A(e) {
    if (e) {
      let t = e.filter((e) => "pending" === e.status).length,
        n = e.filter((e) => "approved" === e.status).length,
        a = e.filter((e) => "rejected" === e.status).length;
      (f.textContent = t), (E.textContent = n), (k.textContent = a);
    }
  }
  function T() {
    document.querySelectorAll(".table-responsive").forEach((e) => {
      e.classList.add("table-has-scroll"),
        e.scrollWidth > e.clientWidth
          ? e.classList.add("can-scroll")
          : e.classList.remove("can-scroll"),
        e.removeEventListener("scroll", j),
        e.addEventListener("scroll", j);
    });
  }
  function j() {
    let e = this.scrollLeft + this.clientWidth >= this.scrollWidth - 10;
    e
      ? this.classList.remove("can-scroll")
      : this.scrollWidth > this.clientWidth && this.classList.add("can-scroll");
  }
  async function C() {
    try {
      var e;
      let t = await fetch("/api/admin/invitation-requests", {
        headers: { Authorization: `Bearer ${L}` },
      });
      if (401 === t.status) {
        localStorage.removeItem("adminToken"), B();
        return;
      }
      let n = await t.json();
      A(n),
        0 === n.length
          ? ((m.innerHTML = ""), (g.style.display = "block"))
          : ((g.style.display = "none"),
            (e = n),
            (m.innerHTML = ""),
            e.forEach((e) => {
              var t;
              let n = document.createElement("tr"),
                a = new Date(e.created_at).toLocaleDateString();
              "approved" === e.status
                ? n.classList.add("table-success")
                : "rejected" === e.status && n.classList.add("table-danger"),
                (n.innerHTML = `
        <td>${e.id}</td>
        <td>${e.email}</td>
        <td>${e.telegram_handle || "-"}</td>
        <td>${e.whatsapp || "-"}</td>
        <td>${e.name || "-"}</td>
        <td>${e.country || "-"}</td>
        <td>${e.daily_volume || "-"}</td>
        <td>${e.referral_source || "-"}</td>
        <td>${a}</td>
        <td><span class="badge ${(function e(t) {
          switch (t) {
            case "pending":
              return "bg-warning";
            case "approved":
              return "bg-success";
            case "rejected":
              return "bg-danger";
            default:
              return "bg-secondary";
          }
        })(e.status)}">${e.status}</span></td>
        <td>${
          ((t = e),
          "pending" === t.status
            ? `
        <button class="btn btn-sm btn-success approve-btn" data-id="${t.id}">
          <i class="bi bi-check-circle"></i>
        </button>
        <button class="btn btn-sm btn-danger reject-btn" data-id="${t.id}">
          <i class="bi bi-x-circle"></i>
        </button>
      `
            : "-")
        }</td>
      `),
                m.appendChild(n);
            }),
            document.querySelectorAll(".approve-btn").forEach((e) => {
              e.addEventListener("click", function () {
                (document.getElementById("request-id").value = this.dataset.id),
                  p.show();
              });
            }),
            document.querySelectorAll(".reject-btn").forEach((e) => {
              e.addEventListener("click", async function () {
                if (confirm("Are you sure you want to reject this request?")) {
                  let e = this.dataset.id;
                  try {
                    let t = await fetch(
                      `/api/admin/invitation-requests/${e}/reject`,
                      {
                        method: "POST",
                        headers: { Authorization: `Bearer ${L}` },
                      }
                    );
                    if (t.ok) C();
                    else {
                      let n = await t.json();
                      alert(n.error || "Failed to reject request");
                    }
                  } catch (a) {
                    alert("An error occurred. Please try again.");
                  }
                }
              });
            })),
        T();
    } catch (a) {
      console.error("Error loading invitation requests:", a),
        alert("Failed to load invitation requests");
    }
  }
  async function S() {
    try {
      let e = await fetch("/api/admin/invitation-codes", {
        headers: { Authorization: `Bearer ${L}` },
      });
      if (401 === e.status) {
        localStorage.removeItem("adminToken"), B();
        return;
      }
      let t = await e.json();
      A(null);
      let n = document.getElementById("codes-table-body"),
        a = document.getElementById("no-codes");
      if (!n) {
        console.error("Element #codes-table-body not found!");
        return;
      }
      a || console.error("Element #no-codes not found!"),
        0 === t.length
          ? ((n.innerHTML = ""), a && (a.style.display = "block"))
          : (a && (a.style.display = "none"),
            (function e(t) {
              let n = document.getElementById("codes-table-body"),
                a = document.getElementById("no-codes");
              if (!n) {
                console.error(
                  "Element #codes-table-body not found in renderCodesTable!"
                );
                return;
              }
              if (
                (a ||
                  console.error(
                    "Element #no-codes not found in renderCodesTable!"
                  ),
                !t || 0 === t.length)
              ) {
                (n.innerHTML = ""), a && (a.style.display = "block");
                return;
              }
              a && (a.style.display = "none"),
                (n.innerHTML = ""),
                t.forEach((e, t) => {
                  var a;
                  let s = document.createElement("tr"),
                    i = new Date(e.created_at).toLocaleDateString(),
                    d = new Date(e.expires_at).toLocaleDateString(),
                    r = e.last_used_at
                      ? new Date(e.last_used_at).toLocaleDateString()
                      : "Never";
                  e.is_active
                    ? new Date(e.expires_at) < new Date() &&
                      s.classList.add("table-warning")
                    : s.classList.add("table-danger");
                  let l = e.is_active
                    ? new Date(e.expires_at) < new Date()
                      ? "Expired"
                      : "Active"
                    : "Revoked";
                  (s.innerHTML = `
        <td>${e.id || "-"}</td>
        <td><code>${e.code || "-"}</code></td>
        <td>${
          (function e(t) {
            if (!t) return console.warn("Type is undefined or null"), "-";
            switch (t) {
              case "A":
                return "A - Payment Link";
              case "B":
                return "B - Merchant Page";
              case "C":
                return "C - Both Features";
              default:
                return console.warn("Unknown code type:", t), t || "-";
            }
          })(e.type) || "-"
        }</td>
        <td>${e.email || "-"}</td>
        <td>${e.telegram_handle || "-"}</td>
        <td>${e.whatsapp || "-"}</td>
        <td>${i}</td>
        <td>${d}</td>
        <td>${r}</td>
        <td class="status-column"><span class="badge ${(function e(t) {
          if (!t)
            return console.warn("Status is undefined or null"), "bg-secondary";
          switch (t) {
            case "Active":
              return "bg-success";
            case "Expired":
              return "bg-warning";
            case "Revoked":
              return "bg-danger";
            default:
              return console.warn("Unknown status:", t), "bg-secondary";
          }
        })(l)}">${l}</span></td>
        <td class="actions-column">${
          ((a = e),
          a
            ? a.is_active && new Date(a.expires_at) >= new Date()
              ? `
        <button class="btn btn-sm btn-danger revoke-btn" data-id="${a.id}">
          <i class="bi bi-x-circle"></i> Revoke
        </button>
      `
              : "-"
            : (console.warn("Code is undefined or null"), "-"))
        }</td>
      `),
                    n.appendChild(s);
                }),
                (function e() {
                  let t = document.querySelectorAll(".revoke-btn");
                  t.forEach((e, t) => {
                    e.addEventListener("click", async function () {
                      if (
                        confirm(
                          "Are you sure you want to revoke this invitation code?"
                        )
                      ) {
                        let e = this.dataset.id;
                        try {
                          let t = await fetch(
                            `/api/admin/invitation-codes/${e}/revoke`,
                            {
                              method: "POST",
                              headers: { Authorization: `Bearer ${L}` },
                            }
                          );
                          if (t.ok) S();
                          else {
                            let n = await t.json();
                            alert(n.error || "Failed to revoke code");
                          }
                        } catch (a) {
                          alert("An error occurred. Please try again.");
                        }
                      }
                    });
                  });
                })();
            })(t)),
        setTimeout(() => {
          T();
        }, 100);
    } catch (s) {
      console.error("Error loading invitation codes:", s),
        alert("Failed to load invitation codes");
    }
  }
  v.setAttribute("data-bs-theme", w),
    "light" === w && b.classList.add("light"),
    b.addEventListener("click", function () {
      let e = v.getAttribute("data-bs-theme"),
        t = "dark" === e ? "light" : "dark";
      v.setAttribute("data-bs-theme", t),
        localStorage.setItem("theme", t),
        this.classList.toggle("light");
    }),
    L ? (I(), q(), C()) : B(),
    n.addEventListener("submit", async function (e) {
      e.preventDefault();
      let t = document.getElementById("login-email").value,
        n = document.getElementById("login-password").value;
      try {
        let s = await fetch("/api/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: t, password: n }),
          }),
          i = await s.json();
        s.ok
          ? ((L = i.token),
            localStorage.setItem("adminToken", L),
            I(),
            q(),
            C())
          : ((a.textContent = i.error || "Invalid credentials"),
            (a.style.display = "block"));
      } catch (d) {
        (a.textContent = "An error occurred. Please try again."),
          (a.style.display = "block");
      }
    }),
    s.addEventListener("click", function () {
      localStorage.removeItem("adminToken"), B();
    }),
    i.addEventListener("click", function (e) {
      e.preventDefault(), q(), C();
    }),
    d.addEventListener("click", function (e) {
      e.preventDefault(),
        (o.style.display = "none"),
        (c.style.display = "block"),
        d.classList.add("active"),
        i.classList.remove("active"),
        S();
    }),
    u.addEventListener("click", C),
    y.addEventListener("click", S),
    h.addEventListener("click", async function () {
      let e = document.getElementById("request-id").value,
        t = document.querySelector('input[name="code-type"]:checked').value;
      try {
        let n = await fetch(`/api/admin/invitation-requests/${e}/approve`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${L}`,
          },
          body: JSON.stringify({ type: t }),
        });
        if (n.ok) p.hide(), C(), S();
        else {
          let a = await n.json();
          alert(a.error || "Failed to approve request");
        }
      } catch (s) {
        alert("An error occurred. Please try again.");
      }
    }),
    window.addEventListener("load", T),
    window.addEventListener("resize", T);
});
