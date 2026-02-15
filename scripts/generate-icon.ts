import sharp from 'sharp';
import path from 'path';

const SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1565C0"/>
      <stop offset="100%" stop-color="#0D47A1"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="1024" height="1024" rx="224" fill="url(#bg)"/>
  <!-- Dartboard rings -->
  <circle cx="512" cy="460" r="280" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="40"/>
  <circle cx="512" cy="460" r="200" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="30"/>
  <circle cx="512" cy="460" r="120" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="24"/>
  <!-- Bull (center circle) -->
  <circle cx="512" cy="460" r="52" fill="#E53935"/>
  <circle cx="512" cy="460" r="22" fill="#B71C1C"/>
  <!-- Dart arrow -->
  <g transform="translate(512,460) rotate(-40)">
    <!-- Shaft -->
    <rect x="-4" y="-200" width="8" height="160" rx="3" fill="rgba(255,255,255,0.9)"/>
    <!-- Tip (pointing to bull) -->
    <polygon points="0,-50 -5,-200 5,-200" fill="#E0E0E0"/>
    <!-- Flight -->
    <path d="M-4,-200 L-36,-260 L-4,-240 Z" fill="#FF7043" opacity="0.9"/>
    <path d="M4,-200 L36,-260 L4,-240 Z" fill="#FF7043" opacity="0.9"/>
  </g>
  <!-- Text -->
  <text x="512" y="820" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="100" font-weight="800" fill="white" letter-spacing="8">DARTS</text>
  <text x="512" y="910" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="64" font-weight="600" fill="rgba(255,255,255,0.7)" letter-spacing="12">LAB</text>
</svg>`;

async function main() {
  const sizes = [
    {
      name: 'AppIcon-512@2x.png',
      dir: 'ios/App/App/Assets.xcassets/AppIcon.appiconset',
      size: 1024,
    },
    { name: 'icon-192.png', dir: 'public/icons', size: 192 },
    { name: 'icon-512.png', dir: 'public/icons', size: 512 },
    { name: 'icon-512-maskable.png', dir: 'public/icons', size: 512 },
  ];

  for (const { name, dir, size } of sizes) {
    const outPath = path.join(process.cwd(), dir, name);
    await sharp(Buffer.from(SVG)).resize(size, size).png().toFile(outPath);
    console.log(`Generated: ${outPath} (${size}x${size})`);
  }
}

main().catch(console.error);
