import { createReducer } from '.'
import { settable } from './settable'

test('Settable reducer behavior creates settable state', () => {
  const [reducer, actions] = createReducer('settable', 0, {
    ...settable<number>(),
  })

  const initial = reducer(undefined, { type: '@' })

  expect(initial).toBe(0)

  const output = reducer(43, actions.set(4))

  expect(output).toBe(4)

  const action = actions.set(4)

  expect(action.type).toBe('@settable/set')
})
