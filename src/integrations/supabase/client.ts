// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = 'https://api.supabase.co/projects/qqcmxpnmxpxmcxlvvxlk';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxY214cG5teHB4bWN4bHZ2eGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQwNTY3NzAsImV4cCI6MjAxOTYzMjc3MH0.Wd_bEzGxlNVXtZQz5JqFfqBWLQEcXHNXWBEwYxpgHBk';

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: localStorage,
      storageKey: 'supabase.auth.token',
      redirectTo: 'https://felipedesigne.github.io/simple-budgeter/dashboard'
    }
  }
);