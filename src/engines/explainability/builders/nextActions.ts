import { msg } from '@/engines/explainability/templates/messages'
import type {
  ExplanationInput,
  MissingDataItem,
  NextActionItem,
} from '@/engines/explainability/types'

export function buildNextActions(
  input: ExplanationInput,
  missing: readonly MissingDataItem[],
): NextActionItem[] {
  const actions: NextActionItem[] = []
  const fields = new Set(missing.map((m) => m.field))

  if (fields.has('pantry')) {
    actions.push(
      Object.freeze({
        id: 'act_pantry',
        action: 'update_pantry',
        message: msg('action.update_pantry', 'Update your pantry to improve matches'),
      }),
    )
  }
  if (fields.has('weight')) {
    actions.push(
      Object.freeze({
        id: 'act_weight',
        action: 'add_weight',
        message: msg('action.add_weight', 'Refresh your weight for better calorie targets'),
      }),
    )
  }
  if (fields.has('weather')) {
    actions.push(
      Object.freeze({
        id: 'act_weather',
        action: 'enable_weather',
        message: msg(
          'action.enable_weather',
          'Add weather context when available for seasonal tuning',
        ),
      }),
    )
  }
  if (fields.has('sleep')) {
    actions.push(
      Object.freeze({
        id: 'act_sleep',
        action: 'log_sleep',
        message: msg('action.log_sleep', 'Log sleep quality to refine daily suggestions'),
      }),
    )
  }

  if (input.confidence?.safetyAction === 'ask_user') {
    actions.push(
      Object.freeze({
        id: 'act_ask',
        action: 'ask_user',
        message: msg(
          'action.ask_user',
          'Confidence is low — confirm this meal before accepting',
        ),
      }),
    )
  } else {
    actions.push(
      Object.freeze({
        id: 'act_accept',
        action: 'accept',
        message: msg('action.accept', 'Accept this meal if it looks right'),
      }),
    )
  }

  if (input.decision.alternatives.length > 0 || input.decision.rejectedMeals.length > 0) {
    actions.push(
      Object.freeze({
        id: 'act_swap',
        action: 'swap',
        message: msg('action.swap', 'Swap to a listed alternative if preferred'),
      }),
    )
  }

  return actions
}
