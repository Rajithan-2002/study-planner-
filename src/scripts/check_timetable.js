const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const envLocal = fs.readFileSync(path.join(__dirname, '../../.env.local'), 'utf8')
const envVars = {}
envLocal.split('\n').forEach(line => {
  const parts = line.split('=')
  if (parts.length >= 2) {
    envVars[parts[0].trim()] = parts.slice(1).join('=').trim()
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data: m1 } = await supabase.from('modules').select('*').eq('id', '42969d10-29ea-4de9-8b81-fbe5c982cb14').maybeSingle()
  const { data: m2 } = await supabase.from('modules').select('*').eq('id', '2d8c12a2-22eb-48dd-8acd-4a20cbad4acf').maybeSingle()
  console.log('M1 OWNER:', m1)
  console.log('M2 OWNER:', m2)
}
check()
