import {FileSchema} from '@/ai/types/shared-types';
import {z} from 'zod';

export const GenerateReadmeInputSchema = z.object({
  files: z.array(FileSchema).describe('The code files of the project.'),
});
export type GenerateReadmeInput = z.infer<typeof GenerateReadmeInputSchema>;

export const GenerateReadmeOutputSchema = z.object({
  readme: z.string().describe('The content of the generated README.md file in Markdown format.'),
});
export type GenerateReadmeOutput = z.infer<typeof GenerateReadmeOutputSchema>;
