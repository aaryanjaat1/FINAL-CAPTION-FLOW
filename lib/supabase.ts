
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aiuebgjhdrzjeeigrybv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdWViZ2poZHJ6amVlaWdyeWJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MTk2NTUsImV4cCI6MjA4MzE5NTY1NX0.BWQVB9eOgj588sPno_3WV0AwhB_gJhT09P7btFv1oHo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
