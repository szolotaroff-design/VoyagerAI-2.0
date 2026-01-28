import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://noivzhnutrgakkcmxddc.supabase.co';
const supabaseKey = 'sb_publishable_dlXOMzVkjrjLakIIXKWESg_-U7zDnYk';

export const supabase = createClient(supabaseUrl, supabaseKey);
