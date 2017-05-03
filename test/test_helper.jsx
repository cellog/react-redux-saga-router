import React, { Component } from 'react'
import teaspoon from 'teaspoon'
import { Provider, connect } from 'react-redux'
import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import createHistory from 'history/createMemoryHistory'

import reducer from '../src/reducer'
import storeEnhancer from '../src/storeEnhancer'

const fakeWeekReducer = (state = 1) => state

function sagaStore(state, reducers = { routing: reducer, week: fakeWeekReducer }, middleware = [],
  enhancer = storeEnhancer(createHistory({
    initialEntries: ['/']
  }))) {
  const log = []
  const logger = store => next => action => { // eslint-disable-line
    log.push(action)
    return next(action)
  }

  const store = createStore(combineReducers(reducers),
    state, compose(enhancer, applyMiddleware(...middleware, logger)))
  return {
    log,
    store,
  }
}

function renderComponent(ComponentClass, props = {}, state = undefined, returnStore = false,
  mySagaStore = sagaStore(state), intoDocument = false) {
  class Tester extends Component {
    constructor(props) {
      super(props)
      this.state = props
    }
    componentWillReceiveProps(props) {
      if (props !== this.props) {
        this.setState(props)
      }
    }
    render() {
      return (
        <Provider store={mySagaStore.store}>
          <ComponentClass {...this.state} />
        </Provider>
      )
    }
  }
  const componentInstance = teaspoon(
    <Tester {...props} />
  ).render(intoDocument)
  const ret = componentInstance
  if (returnStore) {
    return [ret, mySagaStore.store, mySagaStore.log]
  }
  return ret
}

export { renderComponent, connect, sagaStore } // eslint-disable-line
