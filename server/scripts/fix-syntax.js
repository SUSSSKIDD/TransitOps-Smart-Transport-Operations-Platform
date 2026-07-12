const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('dist')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
files.push('./prisma/seed.ts');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Fix empty string imports
  content = content.replace(/from ''/g, "from '../../types/enums'");
  content = content.replace(/from '..\/..\/..\/types\/enums'/g, "from '../../types/enums'");
  // Fix imports from root level
  content = content.replace(/from 'types\/enums'/g, "from '../../types/enums'");

  // Fix duplicate identifiers by stripping enums from @prisma/client
  const enums = ['Role', 'VehicleStatus', 'DriverStatus', 'TripStatus'];
  const prismaImportRegex = /import\s+{([^}]+)}\s+from\s+['"]@prisma\/client['"]/g;
  content = content.replace(prismaImportRegex, (match, p1) => {
    let parts = p1.split(',').map(s => s.trim()).filter(Boolean);
    parts = parts.filter(p => !enums.includes(p));
    if (parts.length === 0) return '';
    return 'import { ' + parts.join(', ') + " } from '@prisma/client'";
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
  }
});
console.log('Fixed imports!');
