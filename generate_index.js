const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const indentation = " ".repeat(2);
const markdownFiles = [];

async function findMarkdownFiles(dirPath) {
    const files = await readdir(dirPath, { withFileTypes: true });

    for (const file of files) {
        const filePath = path.join(dirPath, file.name);

        if (file.isDirectory()) {
            await findMarkdownFiles(filePath);
        } else if (file.name.endsWith('.md')) {
            if (file.name === 'README.md' || file.name === 'index.md') {
                continue;
            }
            markdownFiles.push(filePath);
        }
    }
}

async function generateToc() {
    await findMarkdownFiles('.');

    const tocItems = [];

    for (const file of markdownFiles.sort()) {
        const lines = await readFile(file, 'utf-8').then((content) => content.split('\n'));

        for (const line of lines) {
            if (
                line.startsWith('#define') ||
                line.startsWith('#undef') ||
                line.startsWith('#ifndef') ||
                line.startsWith('#endif') ||
                line.startsWith('#ifdef') ||
                line.startsWith('#else')
            ) {
                continue;
            }

            if (line.startsWith('#')) {
                const level = line.split('#').length - 1;
                const tocItem = line.trim().replace("#", "").trim();
                const title = line.trim().replace(/-/g, '').replace(/[_\.\!\?\+=,$%^，。？、~@￥%……&*《》–<>「」{}【】()/\\\[\]'\":：’]/g, '-').replace(/ /g, '-');                
                const filePath = file.replace('.md', '');
                tocItems.push(`${indentation.repeat(level - 1)}- [${tocItem}](${filePath}${title})`);
            }
        }
    }

    await writeFile('index.md', tocItems.join('\n'));
}

generateToc().then(() => console.log('Table of contents generated successfully.'));
