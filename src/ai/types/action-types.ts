import { z } from 'zod';
import { FileSchema } from '@/ai/types/shared-types';

export const ActionInputSchema = z.object({
  files: z.array(FileSchema).min(1, 'At least one file is required.'),
  errorMessage: z.string().min(1, 'Error message cannot be empty.'),
  fixError: z.boolean(),
  improveErrorHandling: z.boolean(),
  addDebugging: z.boolean(),
  enhanceUserMessages: z.boolean(),
});

export const ReadmeActionInputSchema = z.object({
  files: z.array(FileSchema).min(1, 'At least one file is required.'),
});
