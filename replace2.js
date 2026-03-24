const fs = require('fs');
const path = require('path');

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function walk(dir, execute) {
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
      walk(file, execute);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      execute(file);
    }
  });
}

const findStrings = [
  'const API_BASE_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");',
  'const API_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");',
  'const API_BASE_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")',
  'const API_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")',
  'const API_BASE = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3001");',
  'typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3001")'
];

walk('./src', (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const findStr of findStrings) {
    if (content.includes(findStr)) {
      const replaceStr = findStr.replace('""', '"/proxied-backend"');
      content = content.replace(new RegExp(escapeRegExp(findStr), 'g'), replaceStr);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
  }
});
