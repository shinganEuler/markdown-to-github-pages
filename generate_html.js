const os = require("os");
const fs = require("fs");
const path = require("path");
const mume = require("@shd101wyy/mume");

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

async function generate_html(filePath, destDir) {
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
        copyDirSync(parentDir, destDir);
    }

    return process.exit();
}

generate_html(process.argv[2], process.argv[3]);
