import fs from "fs";
import path from "path";

const fs = require('fs');
const outputFile = 'fineTuningExample.json';

// Read file
function readFile(filepath) {
    return fs.readFileSync(filepath, 'utf8').trim();
}

// Template function
function applyTemplate(systemContent, userContent, assistantContent) {
    return JSON.stringify({
        messages: [
            { role: "system", content: systemContent },
            { role: "user", content: userContent },
            { role: "assistant", content: assistantContent }
        ]
    }, null, 4);
}

// Process file
function processFiles(systemFile, inputFile) {
    const systemContent = readFile(systemFile);
    const content = readFile(inputFile);
    const parts = content.split('\n\n');
    
    if (parts.length < 2) {
        console.error("File does not contain enough parts to split.");
        return;
    }
    
    const output = applyTemplate(systemContent, parts[0], parts[1]);
    if(!fs.existsSync(outputFile))
    {
        fs.writeFileSync(outputFile, '[\n', 'utf8');
    }
    fs.appendFileSync(outputFile, output, 'utf8');
    console.log(`Processed: ${inputFile} -> ${outputFile}`);
}

// Process all .md files in folder
function processFolder(folder, systemFile) {
    const files = fs.readdirSync(folder).filter(file => file.endsWith('.md'));
    files.forEach(file => {
        processFiles(systemFile, path.join(folder, file));
    });
}

processFolder(path.join('..', 'folder'), 'systemPrompt.txt');
fs.appendFileSync(outputFile, '\n]', 'utf8');
