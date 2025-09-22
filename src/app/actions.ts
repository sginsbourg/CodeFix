'use server';

import { suggestCodeFixes } from '@/ai/flows/suggest-code-fixes';
import { generateReadme } from '@/ai/flows/generate-readme';
import type { GenerateReadmeInput, GenerateReadmeOutput } from '@/ai/types/generate-readme-types';
import type { SuggestCodeFixesInput, SuggestCodeFixesOutput } from '@/ai/types/suggest-code-fixes-types';

export async function fixCodeAction(input: SuggestCodeFixesInput): Promise<{ data: SuggestCodeFixesOutput | null; error: string | null }> {
  try {
    const result = await suggestCodeFixes(input);
    if (!result.correctedFiles || !result.explanation) {
      return { data: null, error: "The AI couldn't generate a fix. Please try rephrasing your error or checking your code." };
    }
    return { data: result, error: null };
  } catch (e: any) {
    console.error(e);
    // Catch Zod validation errors and other exceptions
    if (e.errors) {
      const fieldErrors = e.flatten().fieldErrors;
      const errorMessage = Object.values(fieldErrors).flat()[0] || 'Invalid input.';
      return { data: null, error: errorMessage };
    }
    return { data: null, error: e.message || 'An unexpected error occurred while analyzing the code.' };
  }
}

export async function generateReadmeAction(input: GenerateReadmeInput): Promise<{ data: GenerateReadmeOutput | null; error: string | null }> {
  try {
    const result = await generateReadme(input);
    if (!result.readme) {
      return { data: null, error: "The AI couldn't generate a README. Please try again." };
    }
    return { data: result, error: null };
  } catch (e: any) {
    console.error(e);
     if (e.errors) {
      const fieldErrors = e.flatten().fieldErrors;
      const errorMessage = Object.values(fieldErrors).flat()[0] || 'Invalid input.';
      return { data: null, error: errorMessage };
    }
    return { data: null, error: e.message || 'An unexpected error occurred while generating the README.' };
  }
}
