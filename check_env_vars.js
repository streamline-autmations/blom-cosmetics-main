
import fs from 'fs';
import path from 'path';

// Manually load .env
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
        process.env[key] = value;
      }
    });
    console.log('.env file loaded successfully');
  } else {
    console.log('.env file not found');
  }
} catch (e) {
  console.error('Error loading .env file:', e);
}

const vars = [
  'SUPABASE_URL',
  'VITE_SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

console.log('Checking environment variables...');
vars.forEach(v => {
  if (process.env[v]) {
    console.log(`${v} is SET`);
  } else {
    console.log(`${v} is NOT set`);
  }
});
