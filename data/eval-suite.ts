import type { EvalPrompt } from "@/lib/types";

/**
 * Fixed set of prompts run identically against every model during a live
 * comparison, so speed/cost/quality/reasoning stay comparable across vendors.
 */
export const EVAL_SUITE: EvalPrompt[] = [
  {
    id: "coding",
    category: "coding",
    label: "Coding",
    prompt:
      "Write a Python function `longest_increasing_run(nums)` that returns the length of the longest strictly increasing contiguous subsequence in a list of integers. Include a brief explanation.",
  },
  {
    id: "math",
    category: "math",
    label: "Math & Logic",
    prompt:
      "A train leaves station A at 60 km/h heading toward station B, 300 km away. Thirty minutes later, a second train leaves station B at 90 km/h heading toward station A on the same track. How far from station A do they meet? Show your reasoning step by step.",
  },
  {
    id: "reasoning",
    category: "reasoning",
    label: "Reasoning & Planning",
    prompt:
      "Three friends, Ana, Ben, and Cid, each own a different pet (cat, dog, fish) and live on a different floor (1, 2, 3) of the same building. Ana doesn't live on floor 1. The dog owner lives above the cat owner. Cid owns the fish and lives on floor 1. Determine each person's pet and floor, and explain your deduction.",
  },
  {
    id: "creative",
    category: "creative",
    label: "Creative Writing",
    prompt:
      "Write a 4-sentence short story about a lighthouse keeper who receives a message in a bottle, with an unexpected twist ending.",
  },
  {
    id: "knowledge",
    category: "knowledge",
    label: "Knowledge Q&A",
    prompt:
      "Explain, in 3-4 sentences suitable for a non-expert, why the sky appears blue during the day and red/orange at sunset.",
  },
];
