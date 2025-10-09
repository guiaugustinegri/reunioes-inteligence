import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lvzllltiszzwqxvtvswh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2emxsbHRpc3p6d3F4dnR2c3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMDUxODAsImV4cCI6MjA3NTU4MTE4MH0.5_kI7qHDjL_GukbYORnAs-dJjq2QbMT6m8Wru2EdYrE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
