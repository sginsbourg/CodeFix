import {z} from 'zod';

export const FileSchema = z.object({
  name: z.string().describe('The name of the file.'),
  content: z.string().describe('The content of the file.'),
});
export type File = z.infer<typeof FileSchema>;
