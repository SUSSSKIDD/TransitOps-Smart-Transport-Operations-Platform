const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

const files = walk('./src').concat(['./prisma/seed.ts']);
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Quick and dirty replace for the exact imports we used
  // e.g. import { Role } from '@prisma/client' -> import { Role } from '../../types/enums'
  // Since the relative paths vary, it's easier to just use a regex
  
  // Find where it's at
  const depth = (file.match(/\//g) || []).length - 1; // src/config = 1 (../types/enums), src/modules/auth = 2 (../../types/enums)
  let relPath = '';
  if (file === './prisma/seed.ts') relPath = '../src/types/enums';
  else if (depth === 0) relPath = './types/enums'; // src/index.ts
  else if (depth === 1) relPath = '../types/enums';
  else if (depth === 2) relPath = '../../types/enums';
  
  content = content.replace(/import\s+{\s*([^}]*Role[^}]*)\s*}\s+from\s+'@prisma\/client'/g, `import { $1 } from '@prisma/client'\nimport { Role } from '${relPath}'`);
  content = content.replace(/import\s+{\s*([^}]*VehicleStatus[^}]*)\s*}\s+from\s+'@prisma\/client'/g, `import { $1 } from '@prisma/client'\nimport { VehicleStatus } from '${relPath}'`);
  content = content.replace(/import\s+{\s*([^}]*DriverStatus[^}]*)\s*}\s+from\s+'@prisma\/client'/g, `import { $1 } from '@prisma/client'\nimport { DriverStatus } from '${relPath}'`);
  content = content.replace(/import\s+{\s*([^}]*TripStatus[^}]*)\s*}\s+from\s+'@prisma\/client'/g, `import { $1 } from '@prisma/client'\nimport { TripStatus } from '${relPath}'`);
  
  // Cleanup duplicates from the capture group trick
  content = content.replace(/,\s*Role/g, '').replace(/Role\s*,/g, '');
  content = content.replace(/,\s*VehicleStatus/g, '').replace(/VehicleStatus\s*,/g, '');
  content = content.replace(/,\s*DriverStatus/g, '').replace(/DriverStatus\s*,/g, '');
  content = content.replace(/,\s*TripStatus/g, '').replace(/TripStatus\s*,/g, '');
  
  content = content.replace(/import\s+{\s*}\s+from\s+'@prisma\/client'\n/g, '');
  
  // Also handle exact single imports
  content = content.replace(/import { Role } from '@prisma\/client'/g, `import { Role } from '${relPath}'`);
  content = content.replace(/import { VehicleStatus } from '@prisma\/client'/g, `import { VehicleStatus } from '${relPath}'`);
  content = content.replace(/import { DriverStatus } from '@prisma\/client'/g, `import { DriverStatus } from '${relPath}'`);
  content = content.replace(/import { TripStatus } from '@prisma\/client'/g, `import { TripStatus } from '${relPath}'`);

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
});
