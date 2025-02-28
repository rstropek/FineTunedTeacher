import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import readline from "readline";


dotenv.config();
const inputFilePath = path.join("..", "fineTuningExample.jsonl");

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to fine-tune the model
async function fineTuneModel() {
  try {
    console.log("Uploading training file...");
    const trainingFile = await openai.files.create({
      file: fs.createReadStream(inputFilePath),
      purpose: "fine-tune",
    });

    console.log("Training file uploaded:", trainingFile.id);

    console.log("Starting fine-tuning job...");
    const job = await openai.fineTuning.jobs.create({
      training_file: trainingFile.id,
      model: "gpt-4o-2024-08-06",   
    });

    console.log("Fine-tuning job started:", job.id);
    console.log("Waiting for fine-tuning to complete... (This may take some time)");

    // Wait until fine-tuning is done
    return job.id;
  } catch (error) {
    console.error("Error during fine-tuning:", error);
  }
}

// Function to check if the fine-tuning job is complete
async function waitForFineTunedModel(jobId) {
  console.log("Checking fine-tuning job status...");
  
  while (true) {
    const jobs = await openai.fineTuning.jobs.list();
    const job = jobs.data.find(j => j.id === jobId);

    if (job && job.status === "succeeded") {
      console.log("Fine-tuned model is ready:", job.fine_tuned_model);
      return job.fine_tuned_model;
    } else if (job && job.status === "failed") {
      console.log("Fine-tuning job failed.");
      return null;
    }

    console.log("Fine-tuning is still in progress... Checking again in 30 seconds.");
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds before checking again
  }
}

// Function to interact with the fine-tuned model
async function askFineTunedModel(modelId) {
  console.log("\nYou can now ask questions. Type 'q' to quit.\n");

  function askQuestion() {
    rl.question("> ", async (question) => {
      if (question.toLowerCase() === "q") {
        console.log("Exiting program...");
        rl.close();
        return;
      }

      try {
        const response = await openai.chat.completions.create({
          model: modelId,
          messages: [{ role: "user", content: question }],
          temperature: 0.7,
        });

        console.log("Response:", response.choices[0].message.content, "\n");
      } catch (error) {
        console.error("Error querying the fine-tuned model:", error);
      }

      askQuestion(); // Keep asking until the user quits
    });
  }

  askQuestion();
}

// Main function to orchestrate everything
async function main() {
  const jobId = await fineTuneModel();
  if (!jobId) return;

  const modelId = await waitForFineTunedModel(jobId);
  if (!modelId) return;

  await askFineTunedModel(modelId);
}

main();
