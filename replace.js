const fs = require('fs');
const path = require('path');

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

walk('./src', (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const replacePatterns = [
    {
      find: /const API_BASE_URL = process\.env\.NEXT_PUBLIC_API_URL \|\| ['"]http:\/\/localhost:5000['"];/g,
      replace: 'const API_BASE_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");'
    },
    {
      find: /const API_URL = process\.env\.NEXT_PUBLIC_API_URL \|\| ['"]http:\/\/localhost:5000['"];/g,
      replace: 'const API_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");'
    },
    {
      find: /const API_BASE_URL = process\.env\.NEXT_PUBLIC_API_URL \|\| ['"]http:\/\/localhost:5000['"]/g,
      replace: 'const API_BASE_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")'
    },
    {
      find: /const API_URL = process\.env\.NEXT_PUBLIC_API_URL \|\| ['"]http:\/\/localhost:5000['"]/g,
      replace: 'const API_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")'
    },
    {
      find: /const API_BASE = process\.env\.NEXT_PUBLIC_API_URL\?.replace\("\/api", ""\) \|\| "http:\/\/localhost:3001";/g,
      replace: 'const API_BASE = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3001");'
    },
    {
      find: /process\.env\.NEXT_PUBLIC_API_URL\?.replace\("\/api", ""\) \|\| "http:\/\/localhost:3001"/g,
      replace: 'typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3001")'
    },
    {
      find: /process\.env\.NEXT_PUBLIC_API_URL\?.replace\('\/api', ''\) \|\| 'http:\/\/localhost:3001'/g,
      replace: 'typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3001")'
    }
  ];

  for (const pattern of replacePatterns) {
    if (content.match(pattern.find)) {
      content = content.replace(pattern.find, pattern.replace);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
  }
});
