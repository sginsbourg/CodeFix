'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a README.md file for a project.
 *
 * @exports generateReadme - An async function that takes project files and returns a README.md file content.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateReadmeInputSchema,
  type GenerateReadmeInput,
  GenerateReadmeOutputSchema,
  type GenerateReadmeOutput,
} from '@/ai/types/generate-readme-types';

export async function generateReadme(input: GenerateReadmeInput): Promise<GenerateReadmeOutput> {
  return generateReadmeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateReadmePrompt',
  input: {schema: GenerateReadmeInputSchema},
  output: {schema: GenerateReadmeOutputSchema},
  prompt: `You are an AI assistant that helps developers create excellent README.md files for their projects.

You will be given a set of code files from a project. Your task is to generate a comprehensive and well-formatted README.md file in Markdown.

The README should include the following sections:
- A clear and concise project title and description.
- How to get started with the project (e.g., installation, configuration).
- How to use the project.
- An overview of the project structure and key files.

Analyze the provided files to understand the project's purpose, technologies used, and how it works.

Project Files:
{{#each files}}
File: {{this.name}}
\`\`\`
{{{this.content}}}
\`\`\`
{{/each}}
`,
});

const generateReadmeFlow = ai.defineFlow(
  {
    name: 'generateReadmeFlow',
    inputSchema: GenerateReadmeInputSchema,
    outputSchema: GenerateReadmeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
