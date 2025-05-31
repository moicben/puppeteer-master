// Supabase configuration and service for account management
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('SUPABASE_URL and SUPABASE_KEY must be defined in .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service for managing accounts in Supabase
export class AccountsService {
  constructor() {
    this.supabase = supabase;
  }

  // Create a new account record
  async createAccount(accountData) {
    try {
      const { data, error } = await this.supabase
        .from('accounts')
        .insert([{
          email: accountData.email,
          first_name: accountData.first_name,
          last_name: accountData.last_name,
          birth_date: accountData.birth_date,
          birth_place: accountData.birth_place,
          address: accountData.address,
          postal_code: accountData.postal_code,
          city: accountData.city,
          country: accountData.country,
          nationality: accountData.nationality,
          sex: accountData.sex,
          document_number: accountData.document_number,
          expiry_date: accountData.expiry_date,
          issue_date: accountData.issue_date,
          issuing_state: accountData.issuing_state,
          mrz1: accountData.mrz1,
          mrz2: accountData.mrz2,
          status: accountData.status || 'pending',
          notes: accountData.notes,
          service: accountData.service,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase insert error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  // Update account status and additional data
  async updateAccountStatus(accountId, status, additionalData = {}) {
    try {
      const updateData = {
        status: status,
        updated_at: new Date().toISOString(),
        ...additionalData
      };

      const { data, error } = await this.supabase
        .from('accounts')
        .update(updateData)
        .eq('id', accountId)
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase update error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating account status:', error);
      throw error;
    }
  }

  // Check if email already exists
  async emailExists(email) {
    try {
      const { data, error } = await this.supabase
        .from('accounts')
        .select('id')
        .eq('email', email)
        .limit(1);

      if (error) {
        throw new Error(`Supabase query error: ${error.message}`);
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking email existence:', error);
      throw error;
    }
  }

  // Get account statistics
  async getAccountStats() {
    try {
      const { data, error } = await this.supabase
        .from('accounts')
        .select('status');

      if (error) {
        throw new Error(`Supabase query error: ${error.message}`);
      }

      const stats = {
        total: data.length,
        pending: 0,
        extracted: 0,
        success: 0,
        error: 0
      };

      data.forEach(account => {
        const status = account.status || 'pending';
        if (stats.hasOwnProperty(status)) {
          stats[status]++;
        } else {
          stats[status] = 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting account stats:', error);
      throw error;
    }
  }

  // Get account by email
  async getAccountByEmail(email) {
    try {
      const { data, error } = await this.supabase
        .from('accounts')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw new Error(`Supabase query error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error getting account by email:', error);
      throw error;
    }
  }

  // Get all accounts with optional filtering
  async getAccounts(status = null, limit = 100, offset = 0) {
    try {
      let query = this.supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Supabase query error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error getting accounts:', error);
      throw error;
    }
  }

  // Delete account (for testing purposes)
  async deleteAccount(accountId) {
    try {
      const { error } = await this.supabase
        .from('accounts')
        .delete()
        .eq('id', accountId);

      if (error) {
        throw new Error(`Supabase delete error: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }
}
