import OpenAI from "openai";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to read file content
const readFile = (filePath) => fs.readFileSync(filePath, "utf8").trim();

// Read prompt and questions
const promptTemplate = readFile("prompt.md");
const questions = readFile(path.join("..", "questions.txt")).split("\n").map(q => q.trim()).filter(q => q);

// Function to format filename based on question
const formatFileName = (question) =>
  question.toLowerCase().replace(/\s+/g, "_").replace(/[^\w_]/g, "") + ".md";

// Function to send request and save response
const processQuestion = async (question, segment) => {
  const prompt = promptTemplate.replace("{question}", question);

  const fileName = formatFileName(question);
  const folderPath = path.join("..", "files", segment)
  const filePath = path.join(folderPath, fileName);

  // Check if the folder exists, if not, create it
  if (!fs.existsSync(folderPath)) {
    console.log("Folder does not exist, creating it...");
    fs.mkdirSync(folderPath, { recursive: true }); // Creates the directory (and parents if needed)
  }
  // checking for existing Files
  else if (fs.existsSync(filePath)) {
    console.log(`File ${fileName} already exists!`)
    return;
  }

  try {
    const response = await openai.responses.create({
      model: "gpt-4o",
      input: prompt,
  });

    const answer = response.output_text;
    fs.writeFileSync(filePath, `${question}\n{seperator}\n`, "utf8")
    fs.appendFileSync(filePath, answer, "utf8");
    console.log(`Saved response to: ${fileName} in the folder ${folderPath}`);
  } catch (error) {
    console.error(`Error processing question: "${question}"`, error);
  }
};

// Process all questions
(async () => {
  for (let i = 0; i < 81; i++) {
    const question = questions[i];
    await processQuestion(question, i < 50 ? "training" : "test");
  }
})();
