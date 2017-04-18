import * as types from './types'

export function stateRouteShape(params) {
  return {
    name: params.name,
    path: params.path,
    parent: params.parent,
    params: {},
    state: {}
  }
}

function makeUrlAction(name) {
  return (details, state = {}) => ({
    type: types.ACTION,
    payload: {
      verb: name,
      route: details,
      state
    }
  })
}

export const push = makeUrlAction('push')
export const replace = makeUrlAction('replace')

export function go(details) {
  return {
    type: types.ACTION,
    payload: {
      verb: 'go',
      route: details
    }
  }
}

export function goBack() {
  return {
    type: types.ACTION,
    payload: {
      verb: 'goBack'
    }
  }
}

export function goForward() {
  return {
    type: types.ACTION,
    payload: {
      verb: 'goForward'
    }
  }
}

export function matchRoutes(routes) {
  return {
    type: types.MATCH_ROUTES,
    payload: routes
  }
}

export function route(location) {
  return {
    type: types.ROUTE,
    payload: location
  }
}

export function addRoute(params) {
  return {
    type: types.EDIT_ROUTE,
    payload: stateRouteShape(params)
  }
}

export function batch(routes, type) {
  return {
    type,
    payload: {
      ids: routes.map(r => r.name),
      routes: routes.reduce(
        (defs, r) => ({
          ...defs,
          [r.name]: {
            parent: r.parent,
            ...r,
            params: {},
            state: {}
          }
        }), {}
      )
    }
  }
}

export function batchRoutes(routes) {
  return batch(routes, types.BATCH_ROUTES)
}

export function removeRoute(name) {
  return {
    type: types.REMOVE_ROUTE,
    payload: name
  }
}

export function batchRemoveRoutes(routes) {
  return batch(routes, types.BATCH_REMOVE_ROUTES)
}

export function setParamsAndState(details, params, state) {
  return {
    type: types.SET_PARAMS,
    payload: {
      route: details,
      params,
      state
    }
  }
}

export function exitRoutes(routes) {
  return {
    type: types.EXIT_ROUTES,
    payload: routes
  }
}

export function enterRoutes(routes) {
  return {
    type: types.ENTER_ROUTES,
    payload: routes
  }
}

export function pending() {
  return {
    type: types.PENDING_UPDATES,
    payload: null
  }
}

export function commit() {
  return {
    type: types.COMMITTED_UPDATES,
    payload: null
  }
}
