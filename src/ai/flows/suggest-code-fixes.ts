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

You will be given a set of code files and an error message.
Your primary task is to fix the error.
Beyond just fixing the bug, you must also proactively improve the code by:
1.  **Improving User Messages:** Refine any user-facing text (e.g., toast notifications, alerts, logs) to be clearer, more helpful, and more professional.
2.  **Enhancing Debugging:** Add or improve logging to make future debugging easier.
3.  **Bolstering Error Handling:** Implement more robust error handling (e.g., try-catch blocks, checking for null/undefined values) where appropriate.

It's possible the issue spans multiple files. You might need to modify one or several files.
Only return files that require correction or improvement. Do not include unchanged files in your response.

Respond with the corrected code for each file and a single, comprehensive explanation covering all the changes you made, including the bug fix and the improvements.

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
