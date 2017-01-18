import React from 'react'
import Route, { fake } from '../src/Route'
import Routes from '../src/Routes'
import * as actions from '../src/actions'
import { renderComponent } from './test_helper'

describe('react-redux-saga-router Route', () => {
  const paramsFromState = state => ({
    id: state.ensembleTypes.selectedEnsembleType ?
      (state.ensembleTypes.selectedEnsembleType === true ? 'new' : state.ensembleTypes.selectedEnsembleType) :
      undefined,
  })
  const stateFromParams = params => ({
    id: params.id ?
      (params.id === 'new' ? true : params.id) :
      false,
  })
  const updateState = {
    id: (id) => {
      const ret = [actions.selectEnsembleType(id)]
      if (id === true) {
        ret.unshift(actions.newTempEnsembleType())
      }
      return ret
    }
  }
  let component, store, log // eslint-disable-line
  function make(props = {}, Comp = Routes) {
    const info = renderComponent(Comp, props, {}, true)
    component = info[0]
    store = info[1]
    log = info[2]
  }
  it('immediately dispatches a route creation action', () => {
    // eslint-disable-next-line
    const R = () => (<Routes>
      <Route
        name="ensembles"
        path="/ensembles/:id"
        paramsFromState={paramsFromState}
        stateFromParams={stateFromParams}
        updateState={updateState}
      />
    </Routes>)
    make({}, R)
    expect(log).eqls([
      actions.createRoute({
        name: 'ensembles',
        path: '/ensembles/:id',
        paramsFromState,
        stateFromParams,
        updateState
      })
    ])
  })
  it('passes url down to children', () => {
    fake() // for coverage
    const R = () => <Routes>
      <Route
        name="ensembles"
        path="/ensembles/:id"
        paramsFromState={paramsFromState}
        stateFromParams={stateFromParams}
        updateState={updateState}
      >
        <Route
          name="test"
          path="hi/"
        >
          <Route
            name="gronk"
            path="fi"
          />
        </Route>
      </Route>
    </Routes>
    make({}, R)
    expect(log).eqls([
      actions.createRoute({
        name: 'ensembles',
        path: '/ensembles/:id',
        paramsFromState,
        stateFromParams,
        updateState
      }),
      actions.createRoute({
        name: 'test',
        path: '/ensembles/:id/hi/',
        paramsFromState: fake,
        stateFromParams: fake,
        updateState: {}
      }),
      actions.createRoute({
        name: 'gronk',
        path: '/ensembles/:id/hi/fi',
        paramsFromState: fake,
        stateFromParams: fake,
        updateState: {}
      })
    ])
  })
})
