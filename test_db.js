const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => { if (line.includes('=')) { const [k, v] = line.split('='); acc[k.trim()] = Array.from(v.matchAll(/[^\s"']+|"([^"]*)"|'([^']*)'/g)).map(m => m[1] || m[2] || m[0])[0]; } return acc; }, {});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    console.log("Checking profiles table...");
    const { data: pData, error: pError } = await supabase.from('profiles').select('*').limit(3);
    console.log("Profiles Error:", pError);
    console.log("Profiles Data sample:", pData ? pData : null);

    console.log("Checking projects table...");
    const { data: projData, error: projError } = await supabase.from('projects').select('user_id').limit(3);
    console.log("Projects Error:", projError);
    console.log("Projects DB user_id samples:", projData ? projData : null);
}

run();
