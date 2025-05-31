// Simple test supabase config
console.log('Loading simple supabase config...');

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Loading .env from:', path.join(__dirname, '../../.env'));
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('Environment variables loaded');
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_KEY exists:', !!process.env.SUPABASE_KEY);

console.log('Importing @supabase/supabase-js...');
import { createClient } from '@supabase/supabase-js';
console.log('Supabase import successful');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY;

console.log('Creating Supabase client...');
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('Supabase client created successfully');

export class AccountsService {
  constructor() {
    console.log('AccountsService created');
    this.supabase = supabase;
  }
  
  async test() {
    return 'AccountsService is working';
  }
}

console.log('Module exports ready');
