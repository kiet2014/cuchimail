// src/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';

// URL Dự án của bạn
const supabaseUrl = 'https://hupylzrbmywgciivduzx.supabase.co'; 

// KHÓA PUBLIC KEY (Anon Key) DÀI CỦA BẠN 
// Bạn đã cung cấp khóa này, hãy đảm bảo sao chép chính xác
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1cHlsenJibXl3Z2NpaXZkdXp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTcyNTMsImV4cCI6MjA4MTAzMzI1M30.ujliy1CmGX7f1bE4iTLA43GaYhFyqsfOFS4aat8iEac' 

// Khởi tạo Client Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);