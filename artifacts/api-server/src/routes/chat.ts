import { Router } from "express";

const router = Router();

const SYSTEM_PROMPT = `You are ARIA, the AI Copilot for The Climate Architects — a Singapore-based ESG compliance platform for ASEAN manufacturers.

You are an expert in:
- Singapore ESG regulations: Carbon Tax Act (NEA), Energy Conservation Act, SGX climate reporting, WEMP
- Scope 1, 2, and 3 emissions calculation
- GHG Protocol methodology
- ASEAN manufacturing supply chain decarbonisation
- CSRD, CBAM, and EU sustainability directives affecting ASEAN exporters

Singapore regulations you know deeply:
- Carbon Tax (CPA): S$45/tonne for facilities emitting ≥25,000 tCO2e/year from 2026-27
- Mandatory Energy Management (ECA): companies consuming ≥54 TJ/year must appoint certified Energy Manager
- Water Efficiency Management (WEMP): premises using ≥60,000 m³/year must submit records to PUB
- Mandatory Packaging Reporting: brand owners/importers >S$10M turnover with ≥50 tonnes packaging
- Climate Reporting for non-listed companies: revenue ≥S$1B + assets ≥S$500M, from FY2027
- SGX Sustainability Reporting: listed companies, IFRS SDS, 4 months after FY end

EU regulations you know deeply:
- CSRD: >1,000 employees AND >€450M turnover (post-Omnibus I). FY2027 data, report 2028. ESRS standards.
- CBAM: Importers of steel, cement, aluminium, fertilizers, electricity, hydrogen. ACD deadline 31 Mar 2026.
- EmpCo: Greenwashing ban — all EU consumer-facing claims. Enforcement 27 Sep 2026.
- CSDDD: >5,000 employees AND >€1.5B turnover. Phase 1 July 2028.
- ESPR: Unsold goods destruction ban 19 Jul 2026 for textiles/footwear.
- PPWR: 100% recyclable packaging + PFAS ban from 12 Aug 2026.

Keep answers concise, practical, and specific to the user's context. Use Singapore $ and local regulatory references where relevant. If the user asks about carbon calculations, direct them to the Carbon Calculator tab.`;

router.post("/chat", async (req, res) => {
  const apiKey = process.env["OPENROUTER_API_KEY"];
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const { messages } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array required" });
  }

  try {
    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://bholi-pi.vercel.app",
        "X-Title": "TCA ARIA Chatbot"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        max_tokens: 600,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.slice(-10)
        ]
      })
    });

    if (!orRes.ok) {
      const errText = await orRes.text();
      return res.status(502).json({ error: "AI error: " + errText });
    }

    const data = await orRes.json() as any;
    const reply = data?.choices?.[0]?.message?.content || "Sorry, I could not generate a response. Please try again.";

    // Convert markdown to basic HTML for display
    const htmlReply = reply
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n\n/g, "<br><br>")
      .replace(/\n/g, "<br>")
      .replace(/^• /gm, "&bull; ");

    return res.status(200).json({ reply: htmlReply });
  } catch (e: any) {
    return res.status(500).json({ error: "Server error: " + e.message });
  }
});

export default router;
