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
const yaml = require('js-yaml');
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const uslug = require("uslug");
const cheerio = require('cheerio');
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
function generateId(heading) {
    this.table = {};
    const replacement = (match, capture) => {
        let sanitized = capture
            .replace(/[!"#$%&'()*+,./:;<=>?@[\\]^`{|}~]/g, "")
            .replace(/^\s/, "")
            .replace(/\s$/, "")
            .replace(/`/g, "~");
        return ((capture.match(/^\s+$/) ? "~" : sanitized) +
            (match.endsWith(" ") && !sanitized.endsWith("~") ? "~" : ""));
    };
    heading = heading
        .replace(/~|。/g, "") // sanitize
        .replace(/``(.+?)``\s?/g, replacement)
        .replace(/`(.*?)`\s?/g, replacement);
    let slug = uslug(heading.replace(/\s/g, "~")).replace(/~/g, "-");
    if (this.table[slug] >= 0) {
        this.table[slug] = this.table[slug] + 1;
        slug += "-" + this.table[slug];
    }
    else {
        this.table[slug] = 0;
    }
    return slug;
}
function generateIndex(destDir) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`generateIndex destDir: ${destDir}`);
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
                    const tocItem = line.trim().replace(/#/g, '').trim();
                    //const title = "#" + line.toLowerCase().replace(/[:：–\/#？\?$,，]/g, '').replace(/\./g, '').replace(/[_\.\!\+=%^。、~@￥%……&*《》<>「」{}【】()/\\\[\]'\"’\r]/g, '-').replace(/ /g, '-');
                    const title = "#" + generateId(line);
                    const filePath = file.replace('.md', '').replace(path.join(destDir, ""), '');
                    tocItems.push(`${indentation.repeat(level - 1)}- [${tocItem}](${filePath}${title})`);
                }
            }
        }
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir);
        }
        yield writeFile(path.join(destDir, 'index.md'), tocItems.join('\n'));
    });
}
function doGenerateGithubPages(folderPath, destDir) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`doGenerateGithubPages folderPath: ${folderPath} destDir: ${destDir}`);
        const files = fs.readdirSync(folderPath);
        const subFolders = Array();
        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                subFolders.push(filePath);
            }
            else if (path.extname(filePath) === '.md') {
                yield generateHtml(filePath, destDir);
            }
        }
        console.log(`subFolders: ${subFolders}`);
        for (const subFolder of subFolders) {
            console.log(`subFolder begin: ${subFolder}`);
            const subFolderName = path.basename(subFolder);
            const subDestDir = path.join(destDir, subFolderName);
            fs.mkdirSync(subDestDir, { recursive: true });
            try {
                yield doGenerateGithubPages(subFolder, subDestDir);
            }
            catch (err) {
                console.error(err);
            }
            console.log(`subFolder end: ${subFolder}`);
            console.log(`subFolders: ${subFolders}`);
        }
    });
}
// Recursively search all HTML files in the given directory
function insertExtraToHtml(dir, config) {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            insertExtraToHtml(filePath, config);
        }
        else if (path.extname(file) === '.html') {
            // Manipulate the HTML file
            manipulateHTML(filePath, config);
        }
    });
}
// Manipulate the HTML file
function manipulateHTML(filePath, config) {
    const html = fs.readFileSync(filePath, 'utf8');
    const $ = cheerio.load(html);
    const yamlConfig = yaml.load(fs.readFileSync(config, 'utf8'));
    const head = yamlConfig.template.head;
    const body = yamlConfig.template.body;
    const foot = yamlConfig.template.foot;
    const title = yamlConfig.title;
    const h1Content = $('h1').text();
    // Change the page title
    $('title').text(title + " - " + h1Content);
    // Insert the head section
    $('head').prepend(head);
    // Insert the body section at the beginning of the body
    $('body').prepend(body);
    // Insert the foot section at the end of the body
    $('body').append(foot);
    // Write the modified HTML back to the file
    fs.writeFileSync(filePath, $.html());
}
function generateGithubPages(srcDir, destDir, config) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!fs.existsSync(srcDir)) {
            console.error(`srcDir: ${srcDir} not exists`);
            return;
        }
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir);
        }
        try {
            yield doGenerateGithubPages(srcDir, destDir);
            yield generateIndex(destDir);
            yield generateHtml(path.join(destDir, 'index.md'), destDir);
            insertExtraToHtml(destDir, config);
        }
        catch (err) {
            console.error(err);
        }
    });
}
exports.generateGithubPages = generateGithubPages;
//# sourceMappingURL=index.js.map