
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

/* ------------------ SCHEMAS ------------------ */

const AIStockAdvisorInputSchema = z.object({
  productName: z.string(),
  averageDailySales: z.number(),
  supplierLeadTimeDays: z.number(),
  currentStockLevel: z.number(),
});

export type AIStockAdvisorInput = z.infer<
  typeof AIStockAdvisorInputSchema
>;

const AIStockAdvisorOutputSchema = z.object({
  stockoutRisk: z.boolean(),
  recommendedReorderQuantity: z.number(),
  reasoning: z.string(),
});

export type AIStockAdvisorOutput = z.infer<
  typeof AIStockAdvisorOutputSchema
>;

/* ------------------ PROMPT ------------------ */

const aiStockAdvisorPrompt = ai.definePrompt({
  name: 'aiStockAdvisorPrompt',
  model: 'openai/gpt-4o-mini',
  prompt: `
You are an AI inventory assistant.

Respond ONLY in valid JSON:

{
  "stockoutRisk": boolean,
  "recommendedReorderQuantity": number,
  "reasoning": string
}

Product Name: {{productName}}
Average Daily Sales: {{averageDailySales}}
Supplier Lead Time (Days): {{supplierLeadTimeDays}}
Current Stock Level: {{currentStockLevel}}
`,
});

/* ------------------ FLOW ------------------ */

const aiStockAdvisorFlow = ai.defineFlow(
  {
    name: 'aiStockAdvisorFlow',
    inputSchema: AIStockAdvisorInputSchema,
    outputSchema: AIStockAdvisorOutputSchema,
  },
  async (input) => {
    const response = await aiStockAdvisorPrompt(input);
    const text = response.text;

    if (!text) throw new Error('Empty AI response');

    const parsed = JSON.parse(text);
    return AIStockAdvisorOutputSchema.parse(parsed);
  }
);

/* ------------------ EXPORT ------------------ */

export async function aiStockAdvisor(
  input: AIStockAdvisorInput
): Promise<AIStockAdvisorOutput> {
  return aiStockAdvisorFlow(input);
}
