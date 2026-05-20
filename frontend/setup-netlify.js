import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, 'dist');
const redirectsPath = path.join(distDir, '_redirects');

// Make sure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Read backend URL from environment variables
const backendUrl = process.env.BACKEND_URL || process.env.VITE_API_URL || '';

let redirectsContent = '';

if (backendUrl) {
  // Trim trailing slash from backendUrl if present
  const formattedBackendUrl = backendUrl.replace(/\/$/, '');
  console.log(`Configuring Netlify API Proxy to: ${formattedBackendUrl}`);
  redirectsContent = `/api/*  ${formattedBackendUrl}/api/:splat  200!\n`;
} else {
  console.log('⚠️ WARNING: Neither BACKEND_URL nor VITE_API_URL environment variable is set. API proxy will not be active.');
}

// Always append single-page application routing rule so React Router works if used
redirectsContent += `/*  /index.html  200\n`;

fs.writeFileSync(redirectsPath, redirectsContent);
console.log(`✅ Successfully generated _redirects file at: ${redirectsPath}`);
