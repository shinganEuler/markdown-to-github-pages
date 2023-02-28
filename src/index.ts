const os = require("os");
const fs = require("fs");
const path = require("path");
const mume = require("@shd101wyy/mume");
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

function copyDirSync(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest);
    }

    const files = fs.readdirSync(src);
    files.forEach(file => {
        const srcPath = path.join(src, file);
        const destPath = path.join(dest, file);
        if (fs.statSync(srcPath).isDirectory()) {
            copyDirSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

async function generateHtml(filePath, destDir) {
    console.log(`generateHtml filePath: ${filePath}`);
    console.log(`generateHtml destDir: ${destDir}`);

    const engine = new mume.MarkdownEngine({
        filePath: filePath,
        config: {
            previewTheme: "github-light.css",
            codeBlockTheme: "default.css",
            printBackground: true,
            enableScriptExecution: true,
        },
    });

    await engine.htmlExport({ offline: false, runAllCodeChunks: true });

    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir);
    }

    const parentDir = path.dirname(filePath);
    if (fs.existsSync(parentDir)) {
        if (parentDir !== destDir) {
            copyDirSync(parentDir, destDir);
        }
    }
}

const indentation = " ".repeat(2);
const markdownFiles = Array<string>();

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

async function generateIndex(destDir) {
    console.log(`generateIndex destDir: ${destDir}`);

    await findMarkdownFiles(destDir);

    const tocItems = Array<string>();

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
                const tocItem = line.trim().replace(/#/g, '').trim();
                const title = line.trim().replace(/[\-\/#]/g, '').replace(/\./g, '').replace(/[_\.\!\?\+=,$%^，。？、~@￥%……&*《》–<>「」{}【】()/\\\[\]'\":：’]/g, '-').replace(/ /g, '-');
                const filePath = file.replace('.md', '').replace(path.join(destDir, ""), '');
                tocItems.push(`${indentation.repeat(level - 1)}- [${tocItem}](${filePath}${"#" + title})`);
            }
        }
    }

    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir);
    }

    await writeFile(path.join(destDir, 'index.md'), tocItems.join('\n'));
}

async function doGenerateGithubPages(folderPath, destDir) {
    console.log(`doGenerateGithubPages folderPath: ${folderPath} destDir: ${destDir}`);

    const files = fs.readdirSync(folderPath);
    const subFolders = Array<string>();

    for (const file of files) {
        const filePath = path.join(folderPath, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            subFolders.push(filePath);
        } else if (path.extname(filePath) === '.md') {
            await generateHtml(filePath, destDir);
        }
    }

    console.log(`subFolders: ${subFolders}`);
    for (const subFolder of subFolders) {
        console.log(`subFolder begin: ${subFolder}`);
        const subFolderName = path.basename(subFolder);
        const subDestDir = path.join(destDir, subFolderName);
        fs.mkdirSync(subDestDir, { recursive: true });
        try {
            await doGenerateGithubPages(subFolder, subDestDir);
        } catch (err) {
            console.error(err);
        }
        console.log(`subFolder end: ${subFolder}`);
        console.log(`subFolders: ${subFolders}`);
    }
}

async function generateGithubPages(srcDir, destDir) {
    if (!fs.existsSync(srcDir)) {
        console.error(`srcDir: ${srcDir} not exists`);
        return;
    }

    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir);
    }

    try {
        await doGenerateGithubPages(srcDir, destDir);
        await generateIndex(destDir);
        await generateHtml(path.join(destDir, 'index.md'), destDir);
    } catch (err) {
        console.error(err);
    }
}

exports.generateGithubPages = generateGithubPages;
