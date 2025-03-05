/**
 * Script to minify CSS and JavaScript
 * To use: node scripts/minify.js
 */

const fs = require("fs");
const path = require("path");
const UglifyJS = require("uglify-js");
const CleanCSS = require("clean-css");

// Function to minify JavaScript
function minifyJS(inputPath, outputPath) {
  try {
    // Read the original file
    const code = fs.readFileSync(inputPath, "utf8");

    // Minification settings
    const options = {
      compress: {
        drop_console: true, // Remove console.log
        drop_debugger: true, // Remove debugger statements
      },
      mangle: true, // Reduce variable names
      output: {
        comments: "some", // Keep important comments
      },
    };

    // Minify the code
    const result = UglifyJS.minify(code, options);

    if (result.error) {
      console.error(`Error minifying JS: ${result.error}`);
      return false;
    }

    // Save minified file
    fs.writeFileSync(outputPath, result.code, "utf8");

    // Calculate size statistics
    const originalSize = Buffer.byteLength(code, "utf8");
    const minifiedSize = Buffer.byteLength(result.code, "utf8");
    const savingsPercent = (
      ((originalSize - minifiedSize) / originalSize) *
      100
    ).toFixed(2);

    console.log(
      `✓ JS minified: ${path.basename(inputPath)} → ${path.basename(
        outputPath
      )}`
    );
    console.log(`  Original size: ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`  Minified size: ${(minifiedSize / 1024).toFixed(2)} KB`);
    console.log(`  Reduction: ${savingsPercent}%`);

    return true;
  } catch (error) {
    console.error(`Failed to process JS file: ${error.message}`);
    return false;
  }
}

// Function to minify CSS
function minifyCSS(inputPath, outputPath) {
  try {
    // Read the original file
    const css = fs.readFileSync(inputPath, "utf8");

    // Minification settings
    const options = {
      level: 2, // Optimization level (2 is more aggressive)
      format: "keep-breaks", // Keep some line breaks for readability
    };

    // Minify the CSS
    const result = new CleanCSS(options).minify(css);

    if (result.errors.length > 0) {
      console.error(`Error minifying CSS: ${result.errors}`);
      return false;
    }

    // Save minified file
    fs.writeFileSync(outputPath, result.styles, "utf8");

    // Calculate size statistics
    const originalSize = Buffer.byteLength(css, "utf8");
    const minifiedSize = Buffer.byteLength(result.styles, "utf8");
    const savingsPercent = (
      ((originalSize - minifiedSize) / originalSize) *
      100
    ).toFixed(2);

    console.log(
      `✓ CSS minified: ${path.basename(inputPath)} → ${path.basename(
        outputPath
      )}`
    );
    console.log(`  Original size: ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`  Minified size: ${(minifiedSize / 1024).toFixed(2)} KB`);
    console.log(`  Reduction: ${savingsPercent}%`);

    return true;
  } catch (error) {
    console.error(`Failed to process CSS file: ${error.message}`);
    return false;
  }
}

// Run minification
console.log("Starting minification process...");

// Minify JavaScript
minifyJS("scripts/script.js", "scripts/script.min.js");

// Minify CSS
minifyCSS("styles/main.css", "styles/main.min.css");

console.log("Minification process completed!");
console.log("\nTo use the minified files:");
console.log('1. Replace "style.css" with "style.min.css" in your HTML');
console.log('2. Replace "script.js" with "script.min.js" in your HTML');
console.log(
  '3. Add the "defer" attribute to the script to improve loading'
);
