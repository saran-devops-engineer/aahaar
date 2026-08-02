import { localAiAdapter } from '@/ai/localAdapter'
import { offAiAdapter } from '@/ai/offAdapter'
import type { AiAdapter, AiMode } from '@/ai/types'

export type {
  AiAdapter,
  AiExplainRequest,
  AiMode,
  AiMotivateRequest,
  AiSubstitutionCandidate,
  AiSubstitutionRequest,
  AiSubstitutionSuggestion,
  AiVarietyRequest,
  SubstitutionOption,
} from '@/ai/types'

/**
 * AI Adapter registry.
 * Local = offline NL templates. Off = terse engine strings.
 * Remote providers can be plugged in later without touching engines.
 */
let activeAdapter: AiAdapter = localAiAdapter
let activeMode: AiMode = 'local'

export function getAiAdapter(): AiAdapter {
  return activeAdapter
}

export function getAiMode(): AiMode {
  return activeMode
}

export function setAiMode(mode: AiMode): void {
  activeMode = mode
  activeAdapter = mode === 'off' ? offAiAdapter : localAiAdapter
}

export function setAiAdapter(adapter: AiAdapter, mode: AiMode = 'local'): void {
  activeMode = mode
  activeAdapter = adapter
}
