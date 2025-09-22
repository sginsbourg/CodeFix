'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting code fixes based on code and error messages.
 *
 * @exports suggestCodeFixes - An async function that takes code and an error message as input and returns suggested fixes.
 */

import {ai} from '@/ai/genkit';
import {
  SuggestCodeFixesInputSchema,
  type SuggestCodeFixesInput,
  SuggestCodeFixesOutputSchema,
  type SuggestCodeFixesOutput,
} from '@/ai/types/suggest-code-fixes-types';


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
