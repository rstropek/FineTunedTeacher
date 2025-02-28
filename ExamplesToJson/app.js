import fs from "fs";
import path from "path";

const outputFile = path.join('..', 'fineTuningExample.jsonl');

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
    });
}

// Process file
function processFiles(systemFile, inputFile) {
    const systemContent = readFile(systemFile);
    const content = readFile(inputFile);
    const parts = content.split('\n{seperator}\n');
    
    if (parts.length < 2) {
        console.error("File does not contain enough parts to split.");
        return;
    }
    
    const output = applyTemplate(systemContent, parts[0], parts[1]);
    if(firstIteration)
    {
        fs.writeFileSync(outputFile, '', 'utf8');
    }
    else if(!firstIteration)
    {
        fs.appendFileSync(outputFile, '\n', 'utf8');
    }
    fs.appendFileSync(outputFile, output, 'utf8');
    console.log(`Processed: ${inputFile} -> ${outputFile}`);
    firstIteration = false;
}

// Process all .md files in folder
function processFolder(folder, systemFile) {
    const files = fs.readdirSync(folder).filter(file => file.endsWith('.md'));
    files.forEach(file => {
        processFiles(systemFile, path.join(folder, file));
    });
}

let firstIteration = true;
processFolder(path.join('..', 'files'), 'systemPrompt.txt');

