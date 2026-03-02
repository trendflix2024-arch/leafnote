const git = require('isomorphic-git');
const fs = require('fs');
const path = require('path');

const dir = process.cwd();
const remoteUrl = 'https://github.com/trendflix2024-arch/leafnote.git';
const githubToken = process.env.GITHUB_TOKEN;

async function pushToGithub() {
    if (!githubToken) {
        console.error('Error: GITHUB_TOKEN environment variable is missing.');
        process.exit(1);
    }

    try {
        console.log('Initializing repository...');
        await git.init({ fs, dir });

        console.log('Adding all files recursively...');
        async function addFiles(dirPath) {
            const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                const relPath = path.relative(dir, fullPath);

                if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '.next') continue;

                if (entry.isDirectory()) {
                    await addFiles(fullPath);
                } else {
                    const normalizedPath = relPath.replace(/\\/g, '/');
                    await git.add({ fs, dir, filepath: normalizedPath });
                }
            }
        }
        await addFiles(dir);

        console.log('Committing files...');
        const commitSha = await git.commit({
            fs,
            dir,
            author: {
                name: 'LeafNote Agent',
                email: 'agent@leafnote.io',
            },
            message: 'Staging deployment commit'
        });

        console.log('Setting branch to main...');
        try {
            await git.branch({ fs, dir, ref: 'main', object: commitSha, checkout: true });
        } catch (e) {
            if (e.code !== 'AlreadyExistsError') throw e;
            console.log('Branch main already exists, proceeding...');
        }

        console.log('Adding remote...');
        try {
            await git.addRemote({ fs, dir, remote: 'origin', url: remoteUrl });
        } catch (e) {
            // ignore if remote already exists
        }

        console.log(`Pushing to ${remoteUrl}...`);
        const result = await git.push({
            fs,
            dir,
            http: require('isomorphic-git/http/node'),
            remote: 'origin',
            ref: 'main',
            url: remoteUrl,
            force: true,
            onAuth: () => ({ username: 'trendflix2024-arch', password: githubToken }),
        });

        console.log('Successfully pushed to GitHub!', result);
    } catch (err) {
        console.error('An unexpected error occurred:', err);
        if (err.data) console.error('Error data:', err.data);
        process.exit(1);
    }
}

pushToGithub();
