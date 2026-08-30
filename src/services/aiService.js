import { GoogleGenerativeAI } from '@google/generative-ai';
import AppError from '../utils/AppError.js';

function getModel() {
  if (!process.env.GEMINI_API_KEY) {
    throw new AppError('AI service not configured. Set GEMINI_API_KEY environment variable.', 503);
  }
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

export async function generateTaskDescription(input) {
  const model = getModel();
  
  const prompt = 'You are a project management assistant. Generate a clear, detailed task description based on the following brief input. Include: a well-written description, acceptance criteria as bullet points, and any relevant technical notes. Format in markdown.\n\nUser input: ' + input;
  
  const response = await model.generateContent(prompt);
  return response.response.text();
}

export async function summarizeTask(task) {
  const model = getModel();
  
  const commentsContext = task.Comments && task.Comments.length > 0
    ? task.Comments.map(c => `- ${c.content}`).join('\n')
    : 'No comments yet.';
    
  const context = `
Title: ${task.title}
Description: ${task.description || 'N/A'}
Status: ${task.status}
Priority: ${task.priority}

Discussion:
${commentsContext}
  `.trim();
  
  const prompt = 'Summarize the following task and its discussion. Provide: a brief status summary, key decisions made, outstanding questions, and next steps.\n\n' + context;
  
  const response = await model.generateContent(prompt);
  return response.response.text();
}
