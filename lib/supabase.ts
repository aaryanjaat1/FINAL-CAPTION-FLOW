
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://heywhndcsewbdbughksr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhleXdobmRjc2V3YmRidWdoa3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNTg1NDksImV4cCI6MjA4MjkzNDU0OX0.D4Kw8CEoOjtioYj1RXPjQ5lnXCl_PcnARyGUaa2bHS0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
