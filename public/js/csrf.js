/**
 * CSRF Protection Utility
 *
 * This script handles CSRF token management for client-side requests.
 * It fetches a CSRF token from the server and automatically adds it to all AJAX requests.
 */

// Store the CSRF token
let csrfToken = "";

// Function to fetch a new CSRF token from the server
async function fetchCsrfToken() {
    try {
        // Add a cache-busting parameter to avoid caching issues
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/csrf-token?_=${timestamp}`, {
            credentials: "include", // Important: include cookies in the request
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch CSRF token: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.csrfToken) {
            throw new Error("CSRF token not found in response");
        }

        csrfToken = data.csrfToken;

        // Store in localStorage for persistence across page loads
        localStorage.setItem("csrfToken", csrfToken);

        console.log("CSRF token fetched successfully");
        return csrfToken;
    } catch (error) {
        console.error("Error fetching CSRF token:", error);
        return null;
    }
}

// Function to get the current CSRF token or fetch a new one if needed
async function getCsrfToken() {
    // Try to get from memory first
    if (csrfToken) {
        return csrfToken;
    }

    // Try to get from localStorage
    const storedToken = localStorage.getItem("csrfToken");
    if (storedToken) {
        csrfToken = storedToken;
        return csrfToken;
    }

    // Fetch new token if not available
    return await fetchCsrfToken();
}

// Add CSRF token to all AJAX requests
document.addEventListener("DOMContentLoaded", function () {
    // Fetch CSRF token when page loads
    fetchCsrfToken().then((token) => {
        if (token) {
            // Add hidden CSRF input to all forms
            document.querySelectorAll("form").forEach((form) => {
                // Skip if the form already has a CSRF token input
                if (form.querySelector('input[name="_csrf"]')) return;

                // Create and append the CSRF token input
                const csrfInput = document.createElement("input");
                csrfInput.type = "hidden";
                csrfInput.name = "_csrf";
                csrfInput.value = token;
                form.appendChild(csrfInput);

                // Update the token value when the form is submitted
                form.addEventListener("submit", function () {
                    const currentToken = localStorage.getItem("csrfToken");
                    if (currentToken) {
                        const input = this.querySelector('input[name="_csrf"]');
                        if (input) input.value = currentToken;
                    }
                });
            });
        }
    });

    // Intercept fetch requests to add CSRF token
    const originalFetch = window.fetch;
    window.fetch = async function (url, options = {}) {
        // Only add CSRF token for non-GET requests
        if (options.method && !["GET", "HEAD", "OPTIONS"].includes(options.method.toUpperCase())) {
            const token = await getCsrfToken();
            if (token) {
                // Initialize headers if not present
                options.headers = options.headers || {};

                // Add CSRF token to headers
                options.headers["X-CSRF-Token"] = token;

                // For form submissions, also add the token to the body
                if (options.body instanceof FormData) {
                    options.body.append("_csrf", token);
                } else if (options.body && typeof options.body === "string" && options.headers["Content-Type"] === "application/x-www-form-urlencoded") {
                    options.body = options.body + (options.body ? "&" : "") + "_csrf=" + encodeURIComponent(token);
                } else if (options.body && typeof options.body === "string" && options.headers["Content-Type"] === "application/json") {
                    try {
                        const bodyObj = JSON.parse(options.body);
                        bodyObj._csrf = token;
                        options.body = JSON.stringify(bodyObj);
                    } catch (e) {
                        console.error("Error adding CSRF token to JSON body:", e);
                    }
                } else if (!options.body && options.method !== "GET") {
                    // If no body is set for a non-GET request, create one with the CSRF token
                    options.headers["Content-Type"] = "application/json";
                    options.body = JSON.stringify({ _csrf: token });
                }
            }
        }

        // Only include credentials for same-origin requests
        // This fixes the CORS issue with external domains
        const urlObj = new URL(url, window.location.origin);
        const isSameOrigin = urlObj.origin === window.location.origin;

        if (isSameOrigin) {
            // Include credentials for same-origin requests
            options.credentials = options.credentials || "include";
        } else {
            // For cross-origin requests, don't include credentials unless explicitly set
            if (!options.credentials) {
                options.credentials = "same-origin";
            }
        }

        return originalFetch.call(this, url, options);
    };

    // Intercept XMLHttpRequest to add CSRF token
    const originalXhrOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
        this._method = method;
        this._url = url;

        // Check if this is a same-origin request
        try {
            const urlObj = new URL(url, window.location.origin);
            this._isSameOrigin = urlObj.origin === window.location.origin;
        } catch (e) {
            // If URL parsing fails, assume it's same-origin (relative URL)
            this._isSameOrigin = true;
        }

        originalXhrOpen.apply(this, arguments);
    };

    const originalXhrSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (data) {
        if (this._method && !["GET", "HEAD", "OPTIONS"].includes(this._method.toUpperCase())) {
            const token = localStorage.getItem("csrfToken");
            if (token) {
                this.setRequestHeader("X-CSRF-Token", token);

                // For form submissions, also add the token to the body
                if (data instanceof FormData) {
                    data.append("_csrf", token);
                } else if (typeof data === "string" && this.getRequestHeader && this.getRequestHeader("Content-Type") === "application/x-www-form-urlencoded") {
                    data = data + (data ? "&" : "") + "_csrf=" + encodeURIComponent(token);
                } else if (typeof data === "string" && this.getRequestHeader && this.getRequestHeader("Content-Type") === "application/json") {
                    try {
                        const bodyObj = JSON.parse(data);
                        bodyObj._csrf = token;
                        data = JSON.stringify(bodyObj);
                    } catch (e) {
                        console.error("Error adding CSRF token to JSON body:", e);
                    }
                } else if (!data && this._method !== "GET") {
                    // If no data is set for a non-GET request, create one with the CSRF token
                    this.setRequestHeader("Content-Type", "application/json");
                    data = JSON.stringify({ _csrf: token });
                }
            }

            // Only include credentials for same-origin requests
            this.withCredentials = this._isSameOrigin;
        }
        originalXhrSend.call(this, data);
    };

    // For jQuery if it's being used
    if (window.jQuery) {
        jQuery.ajaxPrefilter(function (options, originalOptions, jqXHR) {
            // Check if this is a same-origin request
            let isSameOrigin = false;
            try {
                const urlObj = new URL(options.url, window.location.origin);
                isSameOrigin = urlObj.origin === window.location.origin;
            } catch (e) {
                // If URL parsing fails, assume it's same-origin (relative URL)
                isSameOrigin = true;
            }

            // Only include credentials for same-origin requests
            options.xhrFields = options.xhrFields || {};
            options.xhrFields.withCredentials = isSameOrigin;

            if (!["GET", "HEAD", "OPTIONS"].includes(options.type.toUpperCase())) {
                const token = localStorage.getItem("csrfToken");
                if (token) {
                    jqXHR.setRequestHeader("X-CSRF-Token", token);

                    // For form submissions, also add the token to the data
                    if (options.data instanceof FormData) {
                        options.data.append("_csrf", token);
                    } else if (typeof options.data === "string" && options.contentType === "application/x-www-form-urlencoded") {
                        options.data = options.data + (options.data ? "&" : "") + "_csrf=" + encodeURIComponent(token);
                    } else if (typeof options.data === "string" && options.contentType === "application/json") {
                        try {
                            const dataObj = JSON.parse(options.data);
                            dataObj._csrf = token;
                            options.data = JSON.stringify(dataObj);
                        } catch (e) {
                            console.error("Error adding CSRF token to JSON data:", e);
                        }
                    } else if (typeof options.data === "object") {
                        options.data._csrf = token;
                    } else if (!options.data && options.type !== "GET") {
                        options.data = { _csrf: token };
                    }
                }
            }
        });
    }
});

// Export functions for direct use in other scripts
window.csrfUtils = {
    getToken: getCsrfToken,
    refreshToken: fetchCsrfToken,
};
