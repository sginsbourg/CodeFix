'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting code fixes based on code and error messages.
 *
 * @exports suggestCodeFixes - An async function that takes code and an error message as input and returns suggested fixes.
 * @exports SuggestCodeFixesInput - The input type for the suggestCodeFixes function.
 * @exports SuggestCodeFixesOutput - The output type for the suggestCodeFixes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FileSchema = z.object({
  name: z.string().describe('The name of the file.'),
  content: z.string().describe('The content of the file.'),
});

const SuggestCodeFixesInputSchema = z.object({
  files: z.array(FileSchema).describe('The code files to be analyzed.'),
  errorMessage: z.string().describe('The error message associated with the code.'),
  fixError: z.boolean().describe('Whether to fix the error.'),
  improveErrorHandling: z.boolean().describe('Whether to improve error handling.'),
  addDebugging: z.boolean().describe('Whether to add debugging capabilities.'),
  enhanceUserMessages: z.boolean().describe('Whether to enhance user messages.'),
});
export type SuggestCodeFixesInput = z.infer<typeof SuggestCodeFixesInputSchema>;

const CorrectedFileSchema = z.object({
  name: z.string().describe('The name of the corrected file.'),
  correctedCode: z.string().describe('The corrected code with fixes applied.'),
});

const SuggestCodeFixesOutputSchema = z.object({
  correctedFiles: z.array(CorrectedFileSchema).describe('A list of files with corrections applied.'),
  explanation: z.string().describe('An explanation of the changes made to all files.'),
});
export type SuggestCodeFixesOutput = z.infer<typeof SuggestCodeFixesOutputSchema>;

export async function suggestCodeFixes(input: SuggestCodeFixesInput): Promise<SuggestCodeFixesOutput> {
  return suggestCodeFixesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCodeFixesPrompt',
  input: {schema: SuggestCodeFixesInputSchema},
  output: {schema: SuggestCodeFixesOutputSchema},
  prompt: `You are an AI code assistant that helps developers fix and improve code.

You will be given a set of code files, an error message, and a set of instructions on what to do.
Based on the user's request, you will perform one or more of the following tasks:
{{#if fixError}}
- **Fix the Error:** Analyze the error message and the code to identify the root cause and apply a correction.
{{/if}}
{{#if improveErrorHandling}}
- **Improve Error Handling:** Implement more robust error handling (e.g., try-catch blocks, checking for null/undefined values) where appropriate.
{{/if}}
{{#if addDebugging}}
- **Enhance Debugging:** Add or improve logging to make future debugging easier.
{{/if}}
{{#if enhanceUserMessages}}
- **Improve User Messages:** Refine any user-facing text (e.g., toast notifications, alerts, logs) to be clearer, more helpful, and more professional.
{{/if}}

It's possible the issue spans multiple files. You might need to modify one or several files.
Only return files that require correction or improvement. Do not include unchanged files in your response.

Respond with the corrected code for each file and a single, comprehensive explanation covering all the changes you made based on the requested tasks.

Error Message:
{{errorMessage}}

{{#each files}}
File: {{this.name}}
\`\`\`
{{{this.content}}}
\`\`\`
{{/each}}
`,
});

const suggestCodeFixesFlow = ai.defineFlow(
  {
    name: 'suggestCodeFixesFlow',
    inputSchema: SuggestCodeFixesInputSchema,
    outputSchema: SuggestCodeFixesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
