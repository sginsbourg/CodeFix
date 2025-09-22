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

const SuggestCodeFixesInputSchema = z.object({
  code: z.string().describe('The code to be analyzed.'),
  errorMessage: z.string().describe('The error message associated with the code.'),
});
export type SuggestCodeFixesInput = z.infer<typeof SuggestCodeFixesInputSchema>;

const SuggestCodeFixesOutputSchema = z.object({
  correctedCode: z.string().describe('The corrected code with fixes applied.'),
  explanation: z.string().describe('An explanation of the changes made.'),
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

You will be given a piece of code and an error message.
Your task is to analyze the code and the error message, and suggest corrections to the code.

Respond with the corrected code and an explanation of the changes you made.

Code:
{{code}}

Error Message:
{{errorMessage}}`,
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
