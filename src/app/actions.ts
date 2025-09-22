'use server';

import { suggestCodeFixes } from '@/ai/flows/suggest-code-fixes';
import { generateReadme } from '@/ai/flows/generate-readme';
import type { GenerateReadmeInput, GenerateReadmeOutput } from '@/ai/types/generate-readme-types';
import type { SuggestCodeFixesInput, SuggestCodeFixesOutput } from '@/ai/types/suggest-code-fixes-types';
import fs from 'fs/promises';
import path from 'path';


export async function fixCodeAction(input: SuggestCodeFixesInput): Promise<{ data: SuggestCodeFixesOutput | null; error: string | null }> {
  try {
    const result = await suggestCodeFixes(input);
    if (!result.correctedFiles || !result.explanation) {
      return { data: null, error: "The AI couldn't generate a fix. Please try rephrasing your error or checking your code." };
    }
    return { data: result, error: null };
  } catch (e: any) {
    console.error(e);
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
    return { data: null, error: e.message || 'An unexpected error occurred while generating the README.' };
  }
}

export async function getReadmeAction(): Promise<{ data: string | null; error: string | null }> {
  try {
    const readmePath = path.join(process.cwd(), 'README.md');
    const readmeContent = await fs.readFile(readmePath, 'utf-8');
    return { data: readmeContent, error: null };
  } catch (e: any) {
    console.error(e);
    return { data: null, error: 'Could not read README.md file. It may not exist yet.' };
  }
}
