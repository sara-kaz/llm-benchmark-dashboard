/** Turns raw provider/SDK error text into a short, presentable message for the UI. */
export function friendlyErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (/missing api key/i.test(message)) return "No API key configured";
  if (/429|rate.?limit|quota/i.test(message)) return "Rate limited by provider — try again shortly";
  if (/503|overloaded|high demand|temporarily unavailable/i.test(message)) {
    return "Provider temporarily overloaded — try again shortly";
  }
  if (/401|403|invalid.*api.?key|unauthorized/i.test(message)) return "Invalid API key";

  return message.length > 140 ? `${message.slice(0, 140)}…` : message;
}
