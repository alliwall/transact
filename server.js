const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from current directory
app.use(express.static(__dirname));

// Route for main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/payment-link", (req, res) => {
  res.sendFile(path.join(__dirname, "payment-link.html"));
});

app.get("/payment-url-gen", (req, res) => {
  res.sendFile(path.join(__dirname, "payment-url-gen.html"));
});

app.get("/business-payment", (req, res) => {
  res.sendFile(path.join(__dirname, "business-payment.html"));
});

// Middleware to check if request is for an API resource
const isApiRequest = (req) => {
  return (
    req.path.startsWith("/api/") ||
    req.path.includes("wallet.php") ||
    req.path.includes("payment-link") ||
    req.path.includes("process-payment.php")
  );
};

// Route to handle 404 for API requests
app.use((req, res, next) => {
  if (isApiRequest(req)) {
    return res.status(404).json({
      error: "Not Found",
      message: "The requested resource was not found",
    });
  }
  next();
});

// Serve 404 page for routes not found
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "404.html"));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Press Ctrl+C to terminate`);
});
