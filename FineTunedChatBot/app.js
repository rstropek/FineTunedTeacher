import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import readline from "readline";


dotenv.config();
const inputFilePath = path.join("..", "fineTuningExample_training.jsonl");
const validationInputFilePath = path.join("..", "fineTuningExample_training.jsonl");

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
    console.log("Uploading test file...");
    const validationFile = await openai.files.create({
      file: fs.createReadStream(validationInputFilePath),
      purpose: "fine-tune",
    });

    console.log("Training file uploaded:", trainingFile.id);
    console.log("Test file uploaded:", validationFile.id);

    console.log("Starting fine-tuning job...");
    const job = await openai.fineTuning.jobs.create({
      training_file: trainingFile.id,
      validation_file: validationFile.id,
      model: process.env.BASE_MODEL,   
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

    console.log("Fine-tuning is still in progress... Checking again in 90 seconds.");
    await new Promise(resolve => setTimeout(resolve, 90000)); // Wait 90 seconds before checking again
  }
}

// Function to interact with the fine-tuned model
async function askFineTunedModel(modelId) {
  console.log("\nYou can now ask questions. Type 'q' to quit.\n");

  function askQuestion() {
    rl.question("\n> ", async (question) => {
      if (question.toLowerCase() === "q") {
        console.log("Exiting program...");
        rl.close();
        return;
      }

      try {
        
        const stream = await openai.chat.completions.create({
            model: modelId,
            messages: [{role: "system", content: fs.readFileSync(path.join("..", "systemPrompt.txt"), "utf-8")},{ role: "user", content: question }],
            store: true,
            stream: true,
        });
        
        console.log("Response:\n");
        for await (const chunk of stream) {
            process.stdout.write(chunk.choices[0]?.delta?.content || "");
        }
      } catch (error) {
        console.error("Error querying the fine-tuned model:", error);
      }

      askQuestion(); // Keep asking until the user quits
    });
  }
  console.log(`Used Model: ${modelId}`);
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
