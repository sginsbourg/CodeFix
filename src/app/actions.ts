'use server';

import { suggestCodeFixes } from '@/ai/flows/suggest-code-fixes';
import { generateReadme } from '@/ai/flows/generate-readme';
import type { GenerateReadmeInput, GenerateReadmeOutput } from '@/ai/types/generate-readme-types';
import type { SuggestCodeFixesInput, SuggestCodeFixesOutput } from '@/ai/types/suggest-code-fixes-types';
import { ActionInputSchema, ReadmeActionInputSchema } from '@/ai/types/action-types';

export async function fixCodeAction(input: SuggestCodeFixesInput): Promise<{ data: SuggestCodeFixesOutput | null; error: string | null }> {
  const validation = ActionInputSchema.safeParse(input);
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    const errorMessage = fieldErrors.files?.[0] || fieldErrors.errorMessage?.[0] || 'Invalid input.';
    return { data: null, error: errorMessage };
  }

  try {
    const result = await suggestCodeFixes(validation.data);
    if (!result.correctedFiles || !result.explanation) {
      return { data: null, error: "The AI couldn't generate a fix. Please try rephrasing your error or checking your code." };
    }
    return { data: result, error: null };
  } catch (e) {
    console.error(e);
    return { data: null, error: 'An unexpected error occurred while analyzing the code.' };
  }
}

export async function generateReadmeAction(input: GenerateReadmeInput): Promise<{ data: GenerateReadmeOutput | null; error: string | null }> {
  const validation = ReadmeActionInputSchema.safeParse(input);
  if (!validation.success) {
    return { data: null, error: 'At least one file is required to generate a README.' };
  }

  try {
    const result = await generateReadme(validation.data);
    if (!result.readme) {
      return { data: null, error: "The AI couldn't generate a README. Please try again." };
    }
    return { data: result, error: null };
  } catch (e) {
    console.error(e);
    return { data: null, error: 'An unexpected error occurred while generating the README.' };
  }
}
