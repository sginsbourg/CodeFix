import {z} from 'zod';

export const ExplainErrorContextuallyInputSchema = z.object({
  code: z.string().describe('The code to analyze.'),
  errorMessage: z.string().describe('The error message associated with the code.'),
});
export type ExplainErrorContextuallyInput = z.infer<typeof ExplainErrorContextuallyInputSchema>;

export const ExplainErrorContextuallyOutputSchema = z.object({
  correctedCode: z.string().describe('The corrected code with the error fixed.'),
  explanation: z.string().describe('The explanation of why the error occurred in the context of the code.'),
});
export type ExplainErrorContextuallyOutput = z.infer<typeof ExplainErrorContextuallyOutputSchema>;
