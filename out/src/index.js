var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
        }
        else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}
function generateHtml(filePath, destDir) {
    return __awaiter(this, void 0, void 0, function* () {
        const engine = new mume.MarkdownEngine({
            filePath: filePath,
            config: {
                previewTheme: "github-light.css",
                codeBlockTheme: "default.css",
                printBackground: true,
                enableScriptExecution: true,
            },
        });
        yield engine.htmlExport({ offline: false, runAllCodeChunks: true });
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir);
        }
        const parentDir = path.dirname(filePath);
        if (fs.existsSync(parentDir)) {
            if (parentDir !== destDir) {
                copyDirSync(parentDir, destDir);
            }
        }
        return process.exit();
    });
}
const indentation = " ".repeat(2);
const markdownFiles = Array();
function findMarkdownFiles(dirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const files = yield readdir(dirPath, { withFileTypes: true });
        for (const file of files) {
            const filePath = path.join(dirPath, file.name);
            if (file.isDirectory()) {
                yield findMarkdownFiles(filePath);
            }
            else if (file.name.endsWith('.md')) {
                if (file.name === 'README.md' || file.name === 'index.md') {
                    continue;
                }
                markdownFiles.push(filePath);
            }
        }
    });
}
function generateIndex(destDir) {
    return __awaiter(this, void 0, void 0, function* () {
        yield findMarkdownFiles(destDir);
        const tocItems = Array();
        for (const file of markdownFiles.sort()) {
            const lines = yield readFile(file, 'utf-8').then((content) => content.split('\n'));
            for (const line of lines) {
                if (line.startsWith('#define') ||
                    line.startsWith('#undef') ||
                    line.startsWith('#ifndef') ||
                    line.startsWith('#endif') ||
                    line.startsWith('#ifdef') ||
                    line.startsWith('#else')) {
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
        yield writeFile(path.join(destDir, 'index.md'), tocItems.join('\n'));
    });
}
exports.generateIndex = generateIndex;
exports.generateHtml = generateHtml;
//# sourceMappingURL=index.js.map