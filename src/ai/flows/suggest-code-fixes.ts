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
  prompt: `You are an AI code assistant that helps developers fix code.

You will be given a set of code files and an error message.
Your task is to analyze the code and the error message, and suggest corrections to the code.
It's possible the error is caused by an issue spanning multiple files.
The error might only require fixing one file, or it could require fixing multiple files.
Only return the files that need to be corrected. For any files that are correct and do not need changes, do not include them in the response.

Respond with the corrected code for each file and a single explanation covering all the changes you made.

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
