import { groq } from "@/lib/server/ai/client";
import type { IAIProvider } from "@/lib/server/interfaces";
import { GroqAIProvider } from "./GroqAIProvider";

export const aiProvider: IAIProvider = new GroqAIProvider(groq);
