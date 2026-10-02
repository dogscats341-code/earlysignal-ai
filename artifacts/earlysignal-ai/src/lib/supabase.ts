import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nxvmyjqfzubpubilrxdn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.[STRIPPED 127 bytes].T3a5s9pD8K9b4v6R1x0y2z3a4b5c6d7e8f9g0h1i2j3'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
