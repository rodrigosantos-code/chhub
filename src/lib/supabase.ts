import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vptohjvilmtfzoulexxr.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwdG9oanZpbG10ZnpvdWxleHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NDE1OTcsImV4cCI6MjEwNDAxNzU5N30.BWCYHxaqimF0Ew5pxQWUmU1OnDo80jZasPMmPKAn7S4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
