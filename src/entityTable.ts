export type EntityState<Entity> = Record<string | number, [number, Entity]>

export function entityTable<Entity>(
  getKey: (entity: Entity) => string | number,
) {
  return {
    add(state: EntityState<Entity>, entity: Entity): EntityState<Entity> {
      const key = getKey(entity)
      const entityPair = state[key]
      if (entityPair) {
        const [semaphore, entity] = entityPair
        return { ...state, [key]: [semaphore + 1, entity] }
      } else {
        return { ...state, [key]: [1, entity] }
      }
    },
    remove(state: EntityState<Entity>, entity: Entity): EntityState<Entity> {
      const key = getKey(entity)
      const entityPair = state[key]
      if (entityPair) {
        const [semaphore, entity] = entityPair
        if (semaphore == 1) {
          const newState = { ...state }
          delete newState[key]
          return newState
        } else {
          return { ...state, [key]: [semaphore - 1, entity] }
        }
      } else {
        return state
      }
    },
    update(state: EntityState<Entity>, entity: Entity): EntityState<Entity> {
      const key = getKey(entity)
      const entityPair = state[key]
      if (entityPair) {
        const [semaphore] = entityPair
        return { ...state, [key]: [semaphore, entity] }
      } else {
        return state
      }
    },
  }
}
