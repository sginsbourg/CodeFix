import {FileSchema} from '@/ai/types/shared-types';
import {z} from 'zod';

export const SuggestCodeFixesInputSchema = z.object({
  files: z.array(FileSchema).describe('The code files to be analyzed.'),
  errorMessage: z.string().describe('The error message associated with the code.'),
  fixError: z.boolean().describe('Whether to fix the error.'),
  improveErrorHandling: z.boolean().describe('Whether to improve error handling.'),
  addDebugging: z.boolean().describe('Whether to add debugging capabilities.'),
  enhanceUserMessages: z.boolean().describe('Whether to enhance user messages.'),
});
export type SuggestCodeFixesInput = z.infer<typeof SuggestCodeFixesInputSchema>;

export const CorrectedFileSchema = z.object({
  name: z.string().describe('The name of the corrected file.'),
  correctedCode: z.string().describe('The corrected code with fixes applied.'),
});
export type CorrectedFile = z.infer<typeof CorrectedFileSchema>;

export const SuggestCodeFixesOutputSchema = z.object({
  correctedFiles: z.array(CorrectedFileSchema).describe('A list of files with corrections applied.'),
  explanation: z.string().describe('An explanation of the changes made to all files.'),
});
export type SuggestCodeFixesOutput = z.infer<typeof SuggestCodeFixesOutputSchema>;
