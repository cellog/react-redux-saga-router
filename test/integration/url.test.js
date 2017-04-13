import * as effects from 'redux-saga/effects'
import createHistory from 'history/createMemoryHistory'

import * as helpers from '../test_helper'
import * as sagas from '../../src/sagas'
import * as enhancers from '../../src/enhancers'
import * as actions from '../../src/actions'
import historyChannel from '../../src/historyChannel'
import * as index from '../../src'

describe('react-redux-saga-router integration tests: url changes', () => {
  const history = createHistory({
    initialEntries: [
      '/groups/2017/1',
      '/campers'
    ],
    initialIndex: 1
  })
  const channel = historyChannel(history)
  const options = {
    server: false,
    enhancedRoutes: {
      campers: enhancers.enhanceRoute({
        name: 'campers',
        path: '/campers(/filter/:search)(/camper/:id)',
        paramsFromState: state => ({
          id: state.campers.id,
          search: state.campers.filter ? state.campers.filter : undefined
        }),
        stateFromParams: params => ({
          id: params.id,
          search: params.search ? params.search : false
        }),
        updateState: {
          id: id => ({ type: 'camperid', payload: id }),
          search: filter => ({ type: 'camperfilter', payload: filter }),
        }
      }),
      groups: enhancers.enhanceRoute({
        name: 'groups',
        path: '/groups(/:year/:week)(/:num)',
        paramsFromState: state => ({
          year: state.groups.year,
          week: state.groups.week,
          num: state.groups.selectedGroup ? state.groups.selectedGroup : undefined
        }),
        stateFromParams: params => ({
          year: params.year,
          week: params.week,
          num: params.num ? params.num : false
        }),
        updateState: {
          year: year => ({ type: 'groupyear', payload: year }),
          week: week => ({ type: 'groupweek', payload: week }),
          num: num => ({ type: 'groupnum', payload: num })
        }
      })
    },
    pending: false,
    resolve: false,
  }
  const state = {
    campers: {
      id: undefined,
      filter: false
    },
    groups: {
      year: '1',
      week: '2',
      num: '3'
    },
    routing: {
      location: {
        pathname: '/campers',
        search: '',
        hash: ''
      },
      matchedRoutes: ['campers'],
      routes: {
        ids: ['campers', 'groups'],
        routes: {
          campers: {
            name: 'campers',
            path: '/campers(/filter/:search)(/camper/:id)',
            parent: undefined,
            params: {},
            state: {}
          },
          groups: {
            name: 'groups',
            path: '/groups(/:year/:week)(/:num)',
            parent: undefined,
            params: {},
            state: {}
          }
        },
      }
    }
  }
  const reducers = {
    campers: (state = {
      id: undefined,
      filter: false
    }, action) => {
      switch (action.type) {
        case 'camperid':
          return {
            ...state,
            campers: {
              ...state.campers,
              id: action.payload
            }
          }
        case 'camperfilter':
          return {
            ...state,
            campers: {
              ...state.campers,
              filter: action.payload
            }
          }
        default :
          return state
      }
    },
    groups: (state = {
      year: '1',
      week: '2',
      num: '3'
    }, action) => {
      switch (action.type) {
        case 'groupyear':
          return {
            ...state,
            groups: {
              ...state.groups,
              year: action.payload
            }
          }
        case 'groupweek':
          return {
            ...state,
            groups: {
              ...state.groups,
              week: action.payload
            }
          }
        case 'groupnum':
          return {
            ...state,
            groups: {
              ...state.groups,
              num: action.payload
            }
          }
        default:
          return state
      }
    }
  }
  const run = helpers.testSaga(state, reducers)

  it('URL change affects state, does not cause loop', (done) => {
    run([
      [sagas.routeMonitor, options, history],
      [sagas.stateMonitor, options],
      [sagas.browserListener, history],
      [sagas.locationListener, channel, options],
    ], function *test() {
      yield effects.put.resolve(helpers.START)
      yield effects.take()
      const stuff = (yield effects.select()).length
      for (let i = 1; i < stuff; i++) {
        yield effects.take()
      }
      history.go(-1)

      let ef = yield effects.take()
      expect(ef.effect).eqls(effects.call(index.nonBlockingPending, options))

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.call(index.begin, options))

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.select())

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.call(sagas.matchRoutes, state, '/groups/2017/1', options.enhancedRoutes))

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.put(actions.matchRoutes(['groups'])))

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.select())

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.call(index.nonBlockingPending, options))

      ef = yield effects.take()
      expect(ef.effect).eql(effects.take('*'))

      ef = yield effects.take('put')

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.select())

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.call(index.nonBlockingPending, options))

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.take('*'))

      ef = yield effects.take('put')

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.select())

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.call(index.nonBlockingPending, options))

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.take('*'))

      ef = yield effects.take('call')
      expect(ef.effect).eqls(effects.call(sagas.exitRoute, state, options.enhancedRoutes))

      ef = yield effects.take()
      expect(ef.effect.CALL.fn).eqls(sagas.mapRoute)
      expect(ef.effect.CALL.args).has.length(2)
      expect(ef.effect.CALL.args[1]).eqls(options.enhancedRoutes)

      ef = yield effects.take()
      expect(ef.effect.CALL.args).has.length(1)
      expect(ef.effect.CALL.args[0]).eqls('campers')

      ef = yield effects.take('call')
      const newState = {
        ...state,
        routing: {
          ...state.routing,
          matchedRoutes: ['groups'],
        }
      }
      expect(ef.effect).eqls(effects.call(sagas.stateFromLocation, options.enhancedRoutes, newState, '/groups/2017/1'))

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.fork(sagas.updateState, options.enhancedRoutes.groups, {
        year: '2017', week: '1', num: undefined
      }, newState))

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.call(sagas.getStateUpdates, options.enhancedRoutes.groups, {
        year: '2017', week: '1', num: false
      }))

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.put(actions.setParamsAndState('groups', {
        year: '2017', week: '1', num: undefined
      }, {
        year: '2017', week: '1', num: false
      })))

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.fork(sagas.saveParams, options, actions.setParamsAndState('groups', {
        year: '2017', week: '1', num: undefined
      }, {
        year: '2017', week: '1', num: false
      })))

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.call(index.setEnhancedRoutes, {
        ...options.enhancedRoutes,
        groups: {
          ...options.enhancedRoutes.groups,
          params: {
            year: '2017', week: '1', num: undefined
          },
          state: {
            year: '2017', week: '1', num: false
          }
        }
      }))

      ef = yield effects.take('put')
      expect(ef.effect).eqls(effects.put({ type: 'groupyear', payload: '2017' }))

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.select())

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.call(index.nonBlockingPending, options))

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.take('*'))

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.put({ type: 'groupweek', payload: '1' }))

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.select())

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.call(index.nonBlockingPending, options))

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.take('*'))

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.put({ type: 'groupnum', payload: false }))

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.select())

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.call(index.nonBlockingPending, options))

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.take('*'))

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.put(actions.route({
        pathname: '/groups/2017/1',
        search: '',
        hash: '',
        state: undefined,
        key: undefined
      })))

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.select())

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.call(index.nonBlockingPending, options))

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.take('*'))

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.call(index.commit, options))

      ef = yield effects.take()
      expect(ef.effect).eqls(effects.take(channel))

      yield effects.call(done)
    })
  })
})
