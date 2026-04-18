const fs = require("fs");
const path = require("path");

const srcDir = path.resolve(__dirname, "../dist");
const destDir = path.resolve(__dirname, "../dist/client");

if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

const srcHtml = path.join(srcDir, "index.html");
if (fs.existsSync(srcHtml)) {
  let html = fs.readFileSync(srcHtml, "utf-8");
  html = html.replace(/src="\//g, 'src="./').replace(/href="\//g, 'href="./');
  fs.writeFileSync(path.join(destDir, "index.html"), html);
} else {
  console.error("No se encontró index.html en dist/");
}

const viteSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#1a1a2e"/>
  <text x="50" y="65" font-family="monospace" font-size="40" fill="#e94560" text-anchor="middle">B</text>
</svg>`;
fs.writeFileSync(path.join(destDir, "vite.svg"), viteSvg);

const publicDir = path.resolve(__dirname, "../public");
if (fs.existsSync(publicDir)) {
  function copyDir(src, dest) {
    if (!fs.existsSync(src)) return;
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) copyDir(srcPath, destPath);
      else fs.copyFileSync(srcPath, destPath);
    }
  }
  copyDir(publicDir, destDir);
}

console.log("✅ Build completado");
