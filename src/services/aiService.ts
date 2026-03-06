import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { RFPLane } from '@/constants/types';

// Strict extraction schema using Zod
const bidExtractionSchema = z.object({
    confidence: z.enum(['high', 'low']).describe("If the carrier's text is confusing, incomplete, or explicitly says they are NOT bidding, return 'low'. If they clearly provide a rate for a lane, return 'high'."),
    laneId: z.string().describe("The ID of the lane they are bidding on. You must strictly match their text to one of the provided available lanes. If they bid on multiple, just use the first one for now."),
    rate: z.number().describe("The numeric flat rate dollar amount the carrier is offering."),
    transitTime: z.string().describe("The stated transit time, e.g., '2 Days', 'Next Day'."),
    notes: z.string().describe("A brief summary of any extra conditions or notes the carrier included.")
});

export type ExtractedBid = z.infer<typeof bidExtractionSchema>;

/**
 * Uses an LLM to read raw email text (and attachment text) and extract a structured Bid.
 */
export async function extractBidFromEmail(
    emailSubject: string,
    emailBody: string,
    attachmentText: string | null,
    availableLanes: RFPLane[]
): Promise<ExtractedBid | null> {

    // We only rely on OpenAI if the key exists. Otherwise fail gracefully.
    if (!process.env.OPENAI_API_KEY) {
        console.warn('AI Extraction skipped: OPENAI_API_KEY is missing.');
        return null;
    }

    const openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const lanesContext = availableLanes.map(l =>
        `ID: ${l.id} | Routing: ${l.origin_city}, ${l.origin_state} -> ${l.destination_city}, ${l.destination_state} | Eq: ${l.equipment_type}`
    ).join('\n');

    const promptText = `
You are an expert freight dispatch assistant. 
A carrier has replied to an RFP invitation. Read their email and any attached documents to see if they are submitting a bid.

AVAILABLE LANES:
${lanesContext}

CARRIER EMAIL SUBJECT:
${emailSubject}

CARRIER EMAIL BODY:
${emailBody}

${attachmentText ? `ATTACHMENT TEXT:\n${attachmentText}` : ''}

INSTRUCTIONS:
1. Determine if the carrier is providing a clear rate ($) for one of the Available Lanes.
2. If they are, extract the laneId, the numeric rate, and the transit time. Set confidence to 'high'.
3. If they are just asking a question, rejecting the load, or their text is too confusing, set confidence to 'low'.
4. Do not make up rates.
    `;

    try {
        const { object } = await generateObject({
            model: openai('gpt-4o'),
            schema: bidExtractionSchema,
            prompt: promptText,
            temperature: 0.1, // Keep it deterministic
        });

        return object;
    } catch (error) {
        console.error('AI Extraction failed:', error);
        return null;
    }
}
