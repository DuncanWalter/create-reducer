# @dwalter/create-reducer

`create-reducer` is a tiny (1kb) utility for quickly declaring strongly typed, reusable reducer logic.

## What is a Reducer?

A reducer is a pure function which takes a state and an action as arguments and produces a new state. Typically, reducers also provide some sort of initial state in the form of a default state argument. By convention, reducers use a switch statement on the `type` property of the action argument to determine which logic to execute.

Here's an example of how a reducer and some associated actions might be declared in `typescript` without any utility libraries:

```javascript
interface IncrementCounter {
  type: '@counter/increment'
}

interface DecrementCounter {
  type: '@counter/decrement'
}

interface SetCounter {
  type: '@counter/set'
  value: number
}

type CounterAction = IncrementCounter | DecrementCounter | SetCounter

const actions = {
  increment(): IncrementCounter {
    return { type: '@counter/increment' }
  },
  decrement(): DecrementCounter {
    return { type: '@counter/decrement' }
  },
  set(value): SetCounter {
    return { type: '@counter/set', value }
  },
}

function counter(state = 0, action: CounterAction) {
  switch (action.type) {
    case '@counter/increment':
      return state + 1
    case '@counter/decrement':
      return state - 1
    case '@counter/set':
      return action.value
    default:
      return state
  }
}
```

Reducers are both declarative and simple. This makes them desireable for state management purposes. However, no pattern is perfect. Reducers have a few pain points- particularly when used with certain modern tools. `create-reducer` attempts to address three of these common problems in particular:

- When using type systems, all actions need their types declared and put into a union in order for static analysis to work properly within reducers. This isn't an obscene amount of boilerplate, but it is a noticeable chore.
- When using linting rules which disallow shadowed variable names, variables used in switch cases often need to be hoisted due to changes in seemingly unrelated code. When paired with a type system, this often also means manually typing the variable instead of relying on type inference. This makes variable naming harder and more tedious than it needs to be.
- Oftentimes, several reducers will have similar logic with slightly different action `type` properties. Naively, this means remaking the same logic in each reducer. There are several approaches to combat this duplication. Higher order reducers have been introduced for remaking similar logic with factory methods, though higher order reducers do not allow the resulting reducer logic to be extended in any way. Reducer composition is another potential workaround, but it is unclear how actions for composed reducers could be made reusable without introducing pitfalls and gotchas.

## Using `createReducer()`

The core of `create-reducer` is a function called `createReducer()`. `createReducer()` takes three parameters: a name for the described state, an initial state, and an object with handlers describing all the behaviors of the desired reducer. Notice that the first parameter of each handler is the current state and that the remaining parameters correspond to the parameters of the associated action creator. `createReducer()` returns a pair containing both the reducer function and the associated action creators.

Here's an example of declaring the same reducer from the above example using `createReducer()` in `typescript`:

```javascript
import { createReducer } from '@dwalter/create-reducer'

const [counter, actions] = createReducer('counter', 0, {
  increment(state) {
    return state + 1
  },
  decrement(state) {
    return state - 1
  },
  set(_, value: number) {
    return value
  },
})
```

Note that event though no actions are explicitly typed, `typescript` knows the call signatures of all action creator props on the `actions` variable. Also, each handler has its own function scope, so variable hoisting is no longer an issue.

## Custom Action Types

When passed a string in the first parameter, `createReducer()` generates action types using the property names of the handlers as shown above. It is also possible to pass a function which accepts a handler name and returns an action type string if you need more control over the generated action types.

## Reducer Mixins

So how does `create-reducer` help with reusing reducer logic? Let's imagine we need several pieces of state to be tracked which are arrays. We'll want actions for common array operations in all of them, but we don't want to redeclare the same actions and reducer logic multiple times. So, we declare a reducer mixin as follows:

```javascript
const arraylike = {
  add(state, item) {
    /* Reducer Logic */
  },
  remove(state, item) {
    /* Reducer Logic */
  },
  set(state, index, item) {
    /* Reducer Logic */
  },
}
```

There are several ways to then use a reducer mixin. Most of the time, you will probably want to add more functionality to the reducer in addition to the utility provided by the mixin. Sometimes it may even be useful to withhold or rename handlers from the mixin:

```javascript
const [fooReducer, fooActions] = createReducer('foo', [], arraylike)

const [barReducer, barActions] = createReducer('bar', [], {
  ...arraylike,
  someOtherAction(state, ...payload) {
    /* Reducer Logic */
  },
})

const [bazReducer, bazActions] = createReducer('baz', [], {
  setBaz: arraylike.set,
  yetAnotherAction(state, ...payload) {
    /* Reducer Logic */
  },
})
```

Notice that these mixin examples are done in javascript without type safety. To use mixins in `typescript` effectively, the mixins must include some notion of generics. This is why the mixins provided by `create-reducer` are all functions, not objects:

```javascript
import { createReducer, arraylike } from '@dwalter/create-reducer'

createReducer('foobar', [], {
  ...arraylike<number>(),
  fooTheBar(state, ...payload) {
    /* Reducer Logic */
  },
})
```

## Questions

#### Does `create-reducer` come with support for thunk and/or async actions?

Yes and no? This library only deals with plain object actions. However, these actions can be dispatched freely from within other actionlike abstractions. these features have more to do with the dispatch function than with the reducers, so `create-reducer` opts not to deal with them internally.

#### Why do the type signatures of the generated action creators include a `reducers` prop in the returned actions?

That prop is there for compatibility with `@dwalter/spider-store`, which this library was originally spawned from. The `reducers` prop is in a prototype of the generated actions, so it won't show up in `redux-dev-tools` or break any behaviors of `redux`.

#### Is it ever worth adding utility dependencies like this? How do I decide?

Before I say anything, I found [this](https://medium.com/@dan_abramov/you-might-not-need-redux-be46360cf367) take on dependencies refreshing.

Runtime dependencies are usually a hard no from me, particularly if I can replace it with a couple lines of my own code. In my opinion, things like `lodash` and `rambda` which attempt to add "standard library" utility won't save you time and will waste your bits. Tools with an explicit purpose and limited scope tend to be better. For examples, check out `classnames` and `typestyle`; both of these add a preferred way to complete a specific task with some additional benefit over doing it the "normal" way. I've attempted to make `create-reducer` a preferred way to create reducers in `typescript`, particularly in applications with granular slices of state. If that describes your app, then maybe `create-reducer` would be helpful for you.
