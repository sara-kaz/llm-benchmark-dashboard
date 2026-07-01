/** Parses a JSON object out of an LLM response, tolerating markdown code fences and surrounding prose. */
export function extractJson<T = unknown>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const braceMatch = candidate.match(/\{[\s\S]*\}/);
  const jsonSlice = braceMatch ? braceMatch[0] : candidate;
  return JSON.parse(jsonSlice) as T;
}
