import { Router } from "express";

const router = Router();

const MODELS: Record<string, string> = {
  'gemma-free':   'google/gemma-3-27b-it:free',
  'llama-free':   'meta-llama/llama-3.3-70b-instruct:free',
  'mistral-free': 'mistralai/mistral-small-3.2-24b-instruct:free',
  'gemini-flash': 'google/gemini-2.0-flash-001',
  'claude':       'anthropic/claude-sonnet-4-6'
};

const TEXT_EXTRACTION_PROMPT = `You are an expert carbon accounting analyst specialising in Scope 3 supply chain emissions for ASEAN manufacturing suppliers.

Analyse the following supplier document text carefully. It may be from an invoice, utility bill, delivery note, or factory record from a supplier in Vietnam, Bangladesh, Indonesia, India, Thailand, or another ASEAN country.

Extract every carbon-relevant data point you can find. Look specifically for:
- Energy consumption (electricity in kWh, fuel in litres or kg)
- Production or output volume (units, kg, tonnes, metres)
- Fuel types used (diesel, LPG, natural gas, coal, etc.)
- Company name and location/country
- Industry or product type
- Reporting period or invoice date
- Any existing emissions data or carbon figures

Return ONLY a valid JSON object in this exact format with no additional text, markdown, or explanation:

{
  "extracted": {
    "company_name": "value or null",
    "country": "value or null",
    "industry": "value or null",
    "reporting_period": "value or null",
    "electricity_kwh": "value with unit or null",
    "fuel_type": "value or null",
    "fuel_quantity": "value with unit or null",
    "production_volume": "value with unit or null",
    "product_type": "value or null",
    "existing_emissions_data": "value or null"
  },
  "confidence": "HIGH or MEDIUM or LOW",
  "confidence_reason": "one sentence explaining confidence level",
  "data_gaps": ["list", "of", "missing", "fields"],
  "summary": "2-3 sentence professional summary of what was found and what it means for Scope 3 calculation",
  "methodology_note": "which calculation method will be used: activity-based, spend-based, or hybrid, and why"
}

Confidence levels:
HIGH = direct energy/fuel consumption data found
MEDIUM = production volumes found but no direct energy data
LOW = only company/country/industry found, no activity data

DOCUMENT TEXT:
`;

router.post("/scope3text", async (req, res) => {
  const apiKey = process.env["OPENROUTER_API_KEY"];
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const { text, model } = req.body || {};
  if (!text || text.trim().length < 10) {
    return res.status(400).json({ error: "text is required and must be at least 10 characters" });
  }

  const selectedModel = MODELS[model] || MODELS["llama-free"];

  try {
    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://bholi-pi.vercel.app",
        "X-Title": "TCA Scope3 Text Engine"
      },
      body: JSON.stringify({
        model: selectedModel,
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: TEXT_EXTRACTION_PROMPT + text
          }
        ]
      })
    });

    if (!orRes.ok) {
      const errText = await orRes.text();
      return res.status(502).json({ error: "AI service error. Please try again." });
    }

    const orData = await orRes.json() as any;
    const rawContent = orData?.choices?.[0]?.message?.content;

    if (!rawContent) return res.status(502).json({ error: "No response from AI." });

    let parsed: any;
    try {
      const cleaned = rawContent
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        extracted: {},
        confidence: "LOW",
        confidence_reason: "Could not parse structured data from document text",
        data_gaps: ["all fields"],
        summary: rawContent,
        methodology_note: "Manual review required"
      };
    }

    return res.status(200).json(parsed);
  } catch (e: any) {
    return res.status(500).json({ error: "Server error: " + (e.message || "Unknown") });
  }
});

export default router;
