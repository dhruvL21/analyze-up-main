'use server';

import { openai } from '@/ai/openai';
import { z } from 'zod';
import { Product } from '@/lib/types';

const MappingSchema = z.record(z.string(), z.string());

export type FieldMapping = Record<string, keyof Product | 'skip'>;

const PRODUCT_FIELDS: (keyof Product)[] = [
  'name',
  'description',
  'sku',
  'categoryId',
  'stock',
  'price',
  'imageUrl',
  'supplierId',
];

export async function getSmartMapping(
  externalHeaders: string[]
): Promise<FieldMapping> {
  const prompt = `
You are an AI data assistant. Your task is to map columns from an external "brand" database to our "AnalyzeUp" Inventory schema.

AVAILABLE TARGET FIELDS:
${PRODUCT_FIELDS.join(', ')}

EXTERNAL COLUMNS:
${externalHeaders.join(', ')}

INSTRUCTIONS:
1. Map each external column to the MOST RELEVANT target field.
2. If a column has no clear match, map it to "skip".
3. Return ONLY a JSON object where keys are the external columns and values are the target fields.

Example:
{
  "Product_Name": "name",
  "Qty_Available": "stock",
  "Selling_Price": "price",
  "Unknown_Col": "skip"
}

Respond ONLY with the JSON object.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful data migration assistant.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('Empty AI response');

    const rawMapping = JSON.parse(content);
    
    // Ensure all headers are present in the mapping
    const mapping: FieldMapping = {};
    externalHeaders.forEach(header => {
      const match = rawMapping[header];
      if (match && (PRODUCT_FIELDS.includes(match as any) || match === 'skip')) {
        mapping[header] = match as any;
      } else {
        mapping[header] = 'skip';
      }
    });

    return mapping;
  } catch (error) {
    console.error('Error in getSmartMapping:', error);
    // Fallback to basic mapping if AI fails
    const fallback: FieldMapping = {};
    const normalizedTarget = PRODUCT_FIELDS.map(f => f.toLowerCase());
    
    externalHeaders.forEach(header => {
      const hLower = header.toLowerCase();
      const matchIdx = normalizedTarget.findIndex(t => hLower.includes(t) || t.includes(hLower));
      fallback[header] = matchIdx !== -1 ? PRODUCT_FIELDS[matchIdx] : 'skip';
    });
    return fallback;
  }
}
