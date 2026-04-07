#!/usr/bin/env node

// Simple icon generator using data URLs
const fs = require('fs');
const path = require('path');

const createIcon = (size) => {
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#000000"/>
    <text x="${size/2}" y="${size/2 + size/8}" font-family="Arial, sans-serif" font-size="${size/2.5}" fill="#ffffff" text-anchor="middle" font-weight="bold">💰</text>
  </svg>`;

  return Buffer.from(svg).toString('base64');
};

// Create a simple PNG-like file (actually SVG saved as PNG extension for demo)
const sizes = [192, 512];
const publicDir = path.join(__dirname, '../public');

sizes.forEach(size => {
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#000000" rx="64"/>
  <text x="${size/2}" y="${size/2 + size/8}" font-family="system-ui, -apple-system, sans-serif" font-size="${size/2.5}" fill="#ffffff" text-anchor="middle" font-weight="bold">💰</text>
</svg>`;

  // For now, save as SVG - in production you'd convert to PNG
  fs.writeFileSync(path.join(publicDir, `icon-${size}x${size}.svg`), svg);
  console.log(`Created icon-${size}x${size}.svg`);
});

console.log('\nNote: For production, convert these SVGs to PNG using an image tool.');
console.log('Or use an online tool like https://realfavicongenerator.net/');
