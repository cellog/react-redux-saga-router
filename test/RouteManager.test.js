import RouteParser from 'route-parser'
import createHistory from 'history/createMemoryHistory'
import { put, take, select, call } from 'redux-saga/effects'

import RouteManager, { fake } from '../src/RouteManager'
import * as actions from '../src/actions'
import * as types from '../src/types'

describe('Route', () => {
  describe('basics', () => {
    let route, history // eslint-disable-line
    beforeEach(() => {
      history = createHistory({
        initialEntries: ['/test/hi/there']
      })
      route = new RouteManager(history, {
        name: 'test',
        path: '/test/:test(/:thing)',
        exitParams: {
          test: undefined,
          thing: undefined
        }
      })
    })
    it('RouteManager constructor', () => {
      expect(route.name).eqls('test')
      expect(route.route).eqls(new RouteParser('/test/:test(/:thing)'))
      expect(fake()).eqls({})
      expect(route.exitParams).eqls({
        test: undefined,
        thing: undefined
      })
      const workableRoute1 = new RouteManager(history, {
        name: 'test',
        path: '/test'
      })
      expect(workableRoute1.exitParams).eqls({})
      const workableRoute2 = new RouteManager(history, {
        name: 'test',
        path: '/test(/:id)'
      })
      expect(workableRoute2.exitParams).eqls({ id: undefined })
    })
    it('url', () => {
      expect(route.url({
        test: 'foo',
        thing: 'bar'
      })).eqls('/test/foo/bar')
      expect(route.url({
        test: 'foo',
        thing: undefined
      })).eqls('/test/foo')
      expect(route.url({
      })).eqls(false)
    })
    it('match', () => {
      expect(route.match('/test/foo/bar')).eqls({
        test: 'foo',
        thing: 'bar'
      })
    })
  })
  describe('advanced', () => {
    let route, history, mystate // eslint-disable-line
    beforeEach(() => {
      mystate = {
        testing: 'be',
        thing: 'there',
        routing: {
          location: {
            pathname: '/thing/hi',
            search: '',
            hash: ''
          },
          matchedRoutes: ['foo'],
          routes: {
            ids: ['foo'],
            url: '/thing/:test(/:thing1)',
            routes: {
              foo: {
                name: 'foo',
                params: {
                  test: 'hi',
                  thing1: undefined
                },
                state: {
                  testing: 'hi',
                  thing: undefined
                }
              }
            }
          }
        },
      }
      history = createHistory({
        initialEntries: ['/thing/:test(/:thing1)']
      })
      route = new RouteManager(history, {
        name: 'foo',
        path: '/test/:test(/:thing1)',
        exitParams: params => ({
          test: params.test,
          thing1: undefined
        }),
        paramsFromState: state => ({
          test: state.testing,
          thing1: state.thing
        }),
        stateFromParams: params => ({
          testing: params.test,
          thing: params.thing1
        }),
        updateState: {
          testing: test => ({ type: 'testing', payload: test }),
          thing: thing => ({ type: 'thing', payload: thing })
        }
      })
    })
    it('getState', () => {
      expect(route.getState({
        test: 'hi',
        thing1: 'there'
      })).eqls({
        testing: 'hi',
        thing: 'there'
      })
    })
    it('getParams', () => {
      expect(route.getParams({
        testing: 'hi',
        thing: 'there'
      })).eqls({
        test: 'hi',
        thing1: 'there'
      })
    })
    it('changed', () => {
      expect(RouteManager.changed({}, {
        test: 'hi',
        thing: 'there'
      })).eqls(['test', 'thing'])
      expect(RouteManager.changed({
        test: 'hi',
        thing: '2017'
      }, {
        test: 'hi',
        thing: 2017
      })).eqls(['thing'])
    })
    it('getStateUpdates', () => {
      expect(route.getStateUpdates(mystate, {
        test: 'hif',
        thing1: 'there'
      }, 'foo')).eqls([
        { type: 'testing', payload: 'hif' },
        { type: 'thing', payload: 'there' }
      ])
    })
    it('getUrlUpdate', () => {
      expect(route.getUrlUpdate(mystate, 'foo')).eqls('/test/be/there')
    })
    it('getUrlUpdate, no change', () => {
      mystate.testing = undefined
      mystate.thing = 'hi'
      expect(route.getUrlUpdate(mystate, 'foo')).eqls(false)
    })
    describe('sagas', () => {
      it('exitRoute', () => {
        const saga = route.exitRoute()
        let next = saga.next()

        expect(next.value).eqls(select())
        next = saga.next({
          ...mystate,
          testing: 'ho',
          thing: 'boy',
          routing: {
            ...mystate.routing,
            routes: {
              ...mystate.routing.routes,
              routes: {
                ...mystate.routing.routes.routes,
                foo: {
                  params: {
                    test: 'ho',
                    thing1: 'boy'
                  },
                  state: {
                    testing: 'ho',
                    thing: 'boy'
                  }
                }
              }
            }
          }
        })

        expect(next.value).eqls(call(route.exitParams, {
          test: 'ho',
          thing1: 'boy'
        }))
        next = saga.next(route.exitParams({
          test: 'ho',
          thing1: 'boy'
        }))

        expect(next.value).eqls(put(actions.setParamsAndState(route.name, {
          test: 'ho',
          thing1: undefined
        }, {
          testing: 'ho',
          thing: undefined
        })))
        next = saga.next()

        expect(next.value).eqls([put({ type: 'thing', payload: undefined })])
      })
      it('stateFromLocation', () => {
        const saga = route.stateFromLocation({
          pathname: '/test/hooya/burble',
          search: '',
          hash: ''
        })
        let next = saga.next()

        expect(next.value).eqls(select())
        next = saga.next(mystate)

        expect(next.value).eqls(put(actions.setParamsAndState('foo', {
          test: 'hooya',
          thing1: 'burble'
        }, {
          testing: 'hooya',
          thing: 'burble'
        })))
        next = saga.next()

        expect(next.value).eqls([put({ type: 'testing', payload: 'hooya' })])
        next = saga.next()

        expect(next.value).eqls([put({ type: 'thing', payload: 'burble' })])
        next = saga.next()

        expect(next).eqls({
          value: undefined,
          done: true
        })
      })
      it('stateFromLocation, updateState returns an array', () => {
        route = new RouteManager(history, {
          name: 'foo',
          path: '/test/:test(/:thing1)',
          paramsFromState: state => ({
            test: state.testing,
            thing1: state.thing
          }),
          stateFromParams: params => ({
            testing: params.test,
            thing: params.thing1
          }),
          updateState: {
            testing: test => [{ type: 'testing', payload: test }],
            thing: thing => ({ type: 'thing', payload: thing })
          }
        })
        const saga = route.stateFromLocation({
          pathname: '/test/hooya/burble',
          search: '',
          hash: ''
        })
        let next = saga.next()

        expect(next.value).eqls(select())
        next = saga.next(mystate)

        expect(next.value).eqls(put(actions.setParamsAndState('foo', {
          test: 'hooya',
          thing1: 'burble'
        }, {
          testing: 'hooya',
          thing: 'burble'
        })))
        next = saga.next()

        expect(next.value).eqls([put({ type: 'testing', payload: 'hooya' })])
        next = saga.next()

        expect(next.value).eqls([put({ type: 'thing', payload: 'burble' })])
        next = saga.next()

        expect(next).eqls({
          value: undefined,
          done: true
        })
      })
      it('stateFromLocation, no change, string url', () => {
        mystate.testing = 'hi'
        mystate.thing = undefined
        const saga = route.stateFromLocation('/test/hi')
        let next = saga.next()

        expect(next.value).eqls(select())
        next = saga.next(mystate)
      })
      it('stateFromLocation, route does not match', () => {
        const saga = route.stateFromLocation('/oops')
        let next = saga.next()

        expect(next.value).eqls(select())
        next = saga.next(mystate)

        expect(next).eqls({
          value: undefined,
          done: true
        })
      })
      it('locationFromState', () => {
        const saga = route.locationFromState()
        let next = saga.next()

        expect(next.value).eqls(select())
        next = saga.next(mystate)

        expect(next.value).eqls(put(actions.setParamsAndState('foo', {
          test: 'be',
          thing1: 'there'
        }, {
          testing: 'be',
          thing: 'there'
        })))
        next = saga.next()

        expect(next.value).eqls(put(actions.push('/test/be/there')))
        next = saga.next()

        expect(next).eqls({
          value: undefined,
          done: true
        })
      })
      it('locationFromState, no change', () => {
        mystate.testing = 'hi'
        mystate.thing = undefined
        const saga = route.locationFromState()
        let next = saga.next()

        expect(next.value).eqls(select())
        next = saga.next(mystate)

        expect(next).eqls({
          value: undefined,
          done: true
        })
      })
      it('locationFromState, no match of this route', () => {
        mystate.testing = 'hi'
        mystate.thing = undefined
        mystate.routing.matchedRoutes = []
        const saga = route.locationFromState()
        let next = saga.next()

        expect(next.value).eqls(select())
        next = saga.next(mystate)

        expect(next).eqls({
          value: undefined,
          done: true
        })
      })
      it('initState', () => {
        const saga = route.initState()
        let next = saga.next()

        expect(next.value).eqls(call([route, route.stateFromLocation], route.history.location))
        next = saga.next()

        expect(next).eqls({
          value: undefined,
          done: true
        })
      })
      it('monitorState', () => {
        const saga = route.monitorState()
        let next = saga.next()

        expect(next.value).eqls(take('*'))
        next = saga.next({ type: 'foo' })

        expect(next.value).eqls(call([route, route.locationFromState]))
        next = saga.next()

        expect(next.value).eqls(take('*'))
      })
      it('monitorState during url update', () => {
        const saga = route.monitorState()
        let next = saga.next()

        expect(next.value).eqls(take('*'))
        next = saga.next(actions.pending())

        expect(next.value).eqls(take(types.COMMITTED_UPDATES))
        next = saga.next(actions.commit())

        expect(next.value).eqls(call([route, route.locationFromState]))
        next = saga.next()

        expect(next.value).eqls(take('*'))
      })
      it('monitorUrl', () => {
        const saga = route.monitorUrl('/hi')
        let next = saga.next()

        expect(next.value).eqls(call([route, route.stateFromLocation], '/hi'))
        next = saga.next()

        expect(next).eqls({
          value: undefined,
          done: true
        })
      })
    })
  })
})
