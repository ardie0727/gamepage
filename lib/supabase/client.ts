import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hgqcenrwbxkygodqkgxa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhncWNlbnJ3YnhreWdvZHFrZ3hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MjIzNDcsImV4cCI6MjA1NjQ5ODM0N30.isQM9R1wmRMdjxIw4KkLSqrHkrKXEIjgPaBL_1VVU_s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);