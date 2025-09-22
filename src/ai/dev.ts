import { config } from 'dotenv';
config();

import '@/ai/flows/explain-error-contextually.ts';
import '@/ai/flows/suggest-code-fixes.ts';
import '@/ai/flows/generate-readme.ts';
