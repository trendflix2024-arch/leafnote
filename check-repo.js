const { Octokit } = require("@octokit/rest");
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: '.env.local' });

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN || process.env.GH_TOKEN });
const [owner, repo] = (process.env.GITHUB_REPOSITORY || 'core-value-project-3/project_3').split('/');

async function checkRepo() {
    try {
        console.log(`Checking ${owner}/${repo}...`);

        // Check for the new debug route
        try {
            const { data } = await octokit.repos.getContent({
                owner,
                repo,
                path: 'src/app/api/debug-auth/route.ts'
            });
            console.log('src/app/api/debug-auth/route.ts EXISTS on GitHub');
            console.log('SHA:', data.sha);
        } catch (e) {
            console.log('src/app/api/debug-auth/route.ts DOES NOT EXIST on GitHub');
        }

        // Check for lib/auth.ts (latest state)
        const { data: authData } = await octokit.repos.getContent({
            owner,
            repo,
            path: 'src/lib/auth.ts'
        });
        console.log('src/lib/auth.ts exists, SHA:', authData.sha);

        // List last commits
        const { data: commits } = await octokit.repos.listCommits({
            owner,
            repo,
            per_page: 5
        });
        console.log('Recent Commits:');
        commits.forEach(c => console.log(`- ${c.sha.substring(0, 7)}: ${c.commit.message}`));

    } catch (err) {
        console.error('Error checking repo:', err.message);
    }
}

checkRepo();
