import OpenAI from "openai";
import dotenv from "dotenv";
import {markdownTable} from 'markdown-table'

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Formats a Unix timestamp to a human-readable date and time
 * @param {number|string} timestamp - Unix timestamp
 * @returns {string} Formatted date and time
 */
function formatDate(timestamp) {
  // Check if timestamp is a number or a string that can be converted to a number
  const date = new Date(timestamp * 1000); // Convert seconds to milliseconds if needed
  return date.toLocaleString(); // Format: MM/DD/YYYY, HH:MM:SS AM/PM
}

async function main() {
  const list = await openai.fineTuning.jobs.list();
  const table = [
    ["ID", "Status", "Created At", "Fine Tuned Model"],
    ... list.data.sort((a, b) => b.created_at - a.created_at).map(job => [
        job.id,
        job.status,
        formatDate(job.created_at),
        job.fine_tuned_model,
    ])
  ];
  console.log(markdownTable(table));
}

main();