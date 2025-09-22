'use server';

import { suggestCodeFixes, type SuggestCodeFixesInput, type SuggestCodeFixesOutput } from '@/ai/flows/suggest-code-fixes';
import { z } from 'zod';

const ActionInputSchema = z.object({
  code: z.string().min(1, 'Code cannot be empty.'),
  errorMessage: z.string().min(1, 'Error message cannot be empty.'),
});

export async function fixCodeAction(input: SuggestCodeFixesInput): Promise<{ data: SuggestCodeFixesOutput | null; error: string | null }> {
  const validation = ActionInputSchema.safeParse(input);
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    const errorMessage = fieldErrors.code?.[0] || fieldErrors.errorMessage?.[0] || 'Invalid input.';
    return { data: null, error: errorMessage };
  }

  try {
    const result = await suggestCodeFixes(validation.data);
    if (!result.correctedCode || !result.explanation) {
      return { data: null, error: "The AI couldn't generate a fix. Please try rephrasing your error or checking your code." };
    }
    return { data: result, error: null };
  } catch (e) {
    console.error(e);
    return { data: null, error: 'An unexpected error occurred while analyzing the code.' };
  }
}
