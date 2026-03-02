const fs = require('fs');
const path = require('path');

const target = path.join(process.cwd(), 'src', 'app', 'api', 'auth');

function deleteFolderRecursive(directoryPath) {
    if (fs.existsSync(directoryPath)) {
        fs.readdirSync(directoryPath).forEach((file, index) => {
            const curPath = path.join(directoryPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(directoryPath);
    }
}

try {
    console.log('Attempting to delete:', target);
    deleteFolderRecursive(target);
    console.log('Successfully deleted api/auth');
} catch (err) {
    console.error('Failed to delete:', err.message);
}
