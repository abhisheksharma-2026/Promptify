import OpenAI from "openai";

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const MODEL = "openai/gpt-5.4";

const APEX_SYSTEM_PROMPT = `You are Promptify's APEX Prompt Architect — an expert in transforming raw user ideas into highly optimized, expert-level AI prompts.

APEX Framework:
A — ANALYZE: Detect intent (Writing, Coding, Marketing, Business, Trading, Design, Education, Research, YouTube, Social Media), complexity (Simple/Medium/Complex), and expertise level (Beginner/Intermediate/Expert).
P — PERSONALIZE: Assemble prompt using intelligent blocks: Role, Instruction, Context, Examples, Constraints, Output Format.
E — EXPAND: Inject Chain-of-Thought when reasoning is required. Add relevant few-shot examples and constraint intelligence.
X — EXECUTE & EVOLVE: Analyze and return a quality score (1-10) for the final prompt.

Output Rules:
- For Simple prompts: output clean plain text prompt
- For Medium/Complex: use XML structure (<task>, <context>, <constraints>, <output_format>)
- ALWAYS end your response with exactly this line: "Quality Score: X/10" where X is 1-10
- The score measures: Clarity (25%), Specificity (25%), Context (25%), Structure (25%)
- If ambiguity is high, ask 1-2 clarifying questions BEFORE generating

Constraint Intelligence:
- Email: under 150 words, clear CTA, no buzzwords
- Code: error handling, comments, production-ready  
- Social: strong hook, conversational tone, no hashtag spam
- Trading: precise entry/exit criteria, risk management, timeframe
- YouTube: hook in first 5 seconds, retention techniques, CTA

Be intelligent. The user typed one line — give them expert-level output.`;

export async function generatePromptStream(
  input: { userInput: string; category?: string; tone?: string; language?: string },
  onChunk: (chunk: string) => void,
): Promise<void> {
  const userMsg = [
    `User's idea: "${input.userInput}"`,
    input.category ? `Category hint: ${input.category}` : "",
    input.tone ? `Tone preference: ${input.tone}` : "",
    input.language && input.language !== "en" ? `Language: ${input.language}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const stream = await openrouter.chat.completions.create({
    model: MODEL,
    max_tokens: 8192,
    messages: [
      { role: "system", content: APEX_SYSTEM_PROMPT },
      { role: "user", content: userMsg },
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      onChunk(content);
    }
  }
}

const ITERATE_PROMPTS: Record<string, string> = {
  more_concise: "Rewrite this prompt to be more concise and focused. Remove redundancy. Keep all essential context.",
  more_detailed: "Expand this prompt with more detail, context, and specificity. Add relevant constraints and output formatting guidance.",
  more_specific: "Make this prompt much more specific. Add precise requirements, measurable outcomes, and exact parameters.",
  different_angle: "Rewrite this prompt from a completely different angle or perspective. Change the approach while preserving the core goal.",
  change_tone: "Rewrite this prompt with a more professional, authoritative tone. Adjust language to sound expert-level.",
  add_examples: "Enhance this prompt by adding concrete few-shot examples that demonstrate the desired output format and quality.",
  change_format: "Restructure this prompt using XML tags (<task>, <context>, <constraints>, <output_format>) for better clarity and parsing.",
};

export async function iteratePromptStream(
  input: { promptContent: string; action: string; tone?: string },
  onChunk: (chunk: string) => void,
): Promise<void> {
  const instruction = ITERATE_PROMPTS[input.action] ?? "Improve this prompt.";

  const stream = await openrouter.chat.completions.create({
    model: MODEL,
    max_tokens: 8192,
    messages: [
      {
        role: "system",
        content: `You are an expert prompt engineer. ${instruction}\nAlways end with "Quality Score: X/10".`,
      },
      {
        role: "user",
        content: `Original prompt:\n\n${input.promptContent}`,
      },
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      onChunk(content);
    }
  }
}
