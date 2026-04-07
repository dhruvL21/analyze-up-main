
'use server';

/**
 * @fileOverview AI Business Strategy Generator
 * Generates a detailed, actionable business growth strategy based on sales, product, and market data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

/* -------------------- INPUT SCHEMA -------------------- */

const BusinessStrategyInputSchema = z.object({
  salesData: z.string().describe('Detailed sales data including revenue, product performance, and customer demographics.'),
  productData: z.string().describe('Detailed product data including cost, inventory levels, features, and descriptions.'),
  marketTrends: z.string().optional().describe('Optional information about current market trends relevant to the business.'),
});

export type BusinessStrategyInput = z.infer<typeof BusinessStrategyInputSchema>;

/* -------------------- OUTPUT SCHEMA -------------------- */

const BusinessStrategyOutputSchema = z.object({
  strategySummary: z.string().describe('A concise summary of the proposed business growth strategy.'),
  keyRecommendations: z.string().describe('Clear, actionable recommendations for executing the strategy.'),
  potentialRisks: z.string().describe('Possible risks and challenges associated with the strategy.'),
  expectedOutcomes: z.string().describe('Expected results and benefits from implementing the strategy.'),
});

export type BusinessStrategyOutput = z.infer<typeof BusinessStrategyOutputSchema>;

/* -------------------- PROMPT DEFINITION -------------------- */

const businessStrategyPrompt = ai.definePrompt({
  name: 'businessStrategyPrompt',
  input: { schema: BusinessStrategyInputSchema },
  output: { schema: BusinessStrategyOutputSchema },
  model: 'openai/gpt-4o-mini',
  prompt: `
You are a seasoned business consultant tasked with creating a comprehensive business growth strategy.

Analyze the data provided below carefully:

Sales Data:
{{{salesData}}}

Product Data:
{{{productData}}}

Market Trends (if available):
{{{marketTrends}}}

Based on this information, generate:

1. A concise summary of the overall business strategy.
2. Key actionable recommendations to implement the strategy successfully.
3. Potential risks or obstacles the business might face.
4. Expected outcomes and impact of the strategy when executed effectively.

Focus on practicality and relevance, ensuring the strategy aligns with the data provided.
Respond only in clear, structured JSON matching the output schema.
`,
});

/* -------------------- FLOW DEFINITION -------------------- */

const businessStrategyFlow = ai.defineFlow(
  {
    name: 'businessStrategyFlow',
    inputSchema: BusinessStrategyInputSchema,
    outputSchema: BusinessStrategyOutputSchema,
  },
  async (input) => {
    const { output } = await businessStrategyPrompt(input);

    if (!output) {
      throw new Error('No output received from the AI model.');
    }

    return output;
  }
);

/* -------------------- EXPORT FUNCTION -------------------- */

export async function generateBusinessStrategy(
  input: BusinessStrategyInput
): Promise<BusinessStrategyOutput> {
  return businessStrategyFlow(input);
}
