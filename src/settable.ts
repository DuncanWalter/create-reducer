export function settable<State>() {
  return {
    set(state: State, newState: State) {
      return newState
    },
  }
}
