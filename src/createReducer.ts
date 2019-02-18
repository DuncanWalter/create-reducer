const { assign, create, keys } = Object

interface Action {
  type: string
  reducers: ((state: any, action: any) => any)[]
  payload: unknown
}

interface Reducer<State> {
  (state: State | undefined, action: { type: string }): State
}

interface ReducerConfig<State = any>
  extends Record<string, Handler<State, any[]>> {}

interface Handler<State = any, Payload extends any[] = any[]> {
  (state: State, ...payload: Payload): State
}

type ConfigState<Config extends ReducerConfig> = Config extends ReducerConfig<
  infer State
>
  ? State
  : never

type ActionCreators<State, Config extends ReducerConfig<State>> = {
  [K in keyof Config]: Config[K] extends (
    state: State,
    ...payload: infer Payload
  ) => State
    ? (...payload: Payload) => Action
    : never
}

function defaultName(prefix: string) {
  return function(name: string) {
    return `@${prefix}/${name}`
  }
}

/**
 * Function for declaring a reducer with behaviors for
 * a number of known actions.
 * @param name prefix for action types for logging purposes
 * @param initialState starting state of the reducer
 * @param config reducer behaviors for actions
 */
export function createReducer<Config extends ReducerConfig<any>>(
  name: string | ((name: string) => string),
  initialState: ConfigState<Config>,
  config: Config,
): [Reducer<ConfigState<Config>>, ActionCreators<ConfigState<Config>, Config>] {
  const reducers = [reducer]

  let typeName: (name: string) => string
  if (typeof name === 'function') {
    typeName = name
  } else {
    typeName = defaultName(name)
  }

  const actions = {} as ActionCreators<ConfigState<Config>, Config>
  const handlerKeys = {} as { [actionType: string]: string }

  const baseAction = Object.create(null, {
    reducers: { value: reducers },
  })

  for (let key of keys(config)) {
    handlerKeys[typeName(key)] = key
    actions[key] = function(...payload: any) {
      return assign(create(baseAction), { type: typeName(key), payload })
    } as any
  }

  function reducer(state = initialState, action: any) {
    const handlerKey = handlerKeys[action.type]
    if (!handlerKey) {
      return state
    }
    const handler = config[handlerKey]
    if (!handler) {
      return state
    }
    return handler(state, ...action.payload)
  }

  return [reducer, actions]
}
