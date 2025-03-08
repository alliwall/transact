# Transact - Payment Link Generator

A web application that allows users to generate payment links to receive funds instantly in USDC (on the Polygon network) without the need for a bank account or merchant account. Ideal for freelancers and merchants without a website.

<div align="center">
  <img src="https://img.shields.io/badge/Desenvolvido%20por-rsoaresdev-blue?style=for-the-badge" alt="Developed by rsoaresdev" />
  <h3>⭐ <a href="https://github.com/rsoaresdev">https://github.com/rsoaresdev</a> ⭐</h3>
  <p><strong>Developed with ❤️ by Rafael Soares</strong></p>
</div>

## Features

- Custom payment link generation
- Merchant page generator with locked receiver wallet address
- Support for multiple currencies (USD, EUR, CAD, INR)
- Various integrated payment providers
- Light/dark theme
- Payment link sharing
- Fully responsive for mobile and desktop devices
- No KYC required

## New Features Added

### Merchant Page Generator

Merchants can now generate custom merchant pages with a locked wallet address. The generated pages can be shared with their customers to process payments directly to the merchant's wallet.

- Access the generator at: `/generate-merchant-link`
- Generated merchant pages format: `/merchant-payment.html?data=encryptedWalletAddress`

### Enhanced Security Features

1. **Wallet Address Encryption**:
   - The wallet address is now securely encrypted using AES-GCM encryption before being included in the URL
   - The encrypted data cannot be decrypted without the encryption key
   - This prevents tampering with the wallet address in the URL

2. **Code Obfuscation**:
   - All JavaScript code is obfuscated to prevent reverse engineering
   - To obfuscate the code, run:
     ```
     npm install javascript-obfuscator fs path
     node scripts/obfuscate.js
     ```
   - Update your HTML files to reference the `.min.js` versions after obfuscation

## Pages

- **Standard Payment Link Generator** (`/index.html`) - For individual users to create payment links with their own wallet address
- **Merchant Page Generator** (`/generate-merchant-link.html`) - For merchants to create a pre-configured payment page with a locked wallet address
- **Merchant Payment Page** (`/merchant-payment.html`) - Generated payment page for merchant customers where only amount, email, and payment provider can be configured by the end user

## Technologies Used

- HTML5
- CSS3 with custom CSS variables
- JavaScript ES6+
- Bootstrap 5.3.3
- Font Awesome 6.5.2
- Google Fonts (Inter)

## Security Considerations

- The wallet address encryption uses a fixed key for demonstration purposes. In a production environment, this should be replaced with a secure, randomly generated key stored in environment variables.
- The encryption key should never be exposed in client-side code in a production environment.
- Additional server-side validation should be implemented to verify the authenticity of payment requests.

## Available Pages

- `/index.html` - Main page with payment form
- `/payment.html` - Standard payment page
- `/generate-merchant-link.html` - Merchant page generator
- `/merchant-payment.html` - Merchant payment page with locked wallet address
