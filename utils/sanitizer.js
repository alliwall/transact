/**
 * HTML Sanitizer Utility
 *
 * This module provides functions to sanitize HTML content to prevent XSS attacks.
 * It uses a simple approach to remove potentially dangerous tags and attributes.
 * For production use, consider using a more robust library like DOMPurify.
 */

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param {string} html - The HTML content to sanitize
 * @returns {string} - The sanitized HTML content
 */
const sanitizeHtml = (html) => {
  if (!html) return "";

  // Convert to string if not already
  const htmlString = String(html);

  // Remove potentially dangerous tags
  let sanitized = htmlString
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/<base\b[^<]*(?:(?!<\/base>)<[^<]*)*<\/base>/gi, "")
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, "")
    .replace(/<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, "");

  // Remove potentially dangerous attributes
  sanitized = sanitized
    .replace(/on\w+="[^"]*"/gi, "") // Remove event handlers
    .replace(/on\w+='[^']*'/gi, "")
    .replace(/on\w+=\w+/gi, "")
    .replace(/javascript:[^\s"']+/gi, "") // Remove javascript: URLs
    .replace(/data:[^\s"']+/gi, "") // Remove data: URLs
    .replace(/vbscript:[^\s"']+/gi, ""); // Remove vbscript: URLs

  return sanitized;
};

/**
 * Sanitizes a plain text string to be safely included in HTML
 * @param {string} text - The text to sanitize
 * @returns {string} - The sanitized text
 */
const escapeHtml = (text) => {
  if (!text) return "";

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

module.exports = {
  sanitizeHtml,
  escapeHtml,
};
