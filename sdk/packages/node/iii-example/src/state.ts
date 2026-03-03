import { iii } from './iii'
import type {
  IState,
  StateDeleteInput,
  StateDeleteResult,
  StateGetInput,
  StateListInput,
  StateSetInput,
  StateSetResult,
  StateUpdateInput,
  StateUpdateResult,
} from 'iii-sdk/state'

export const state: IState = {
  get: <TData>(input: StateGetInput): Promise<TData | null> => iii.call('state::get', input),
  set: <TData>(input: StateSetInput): Promise<StateSetResult<TData> | null> =>
    iii.call('state::set', input),
  delete: (input: StateDeleteInput): Promise<StateDeleteResult> => iii.call('state::delete', input),
  list: <TData>(input: StateListInput): Promise<TData[]> => iii.call('state::list', input),
  update: <TData>(input: StateUpdateInput): Promise<StateUpdateResult<TData> | null> =>
    iii.call('state::update', input),
}
