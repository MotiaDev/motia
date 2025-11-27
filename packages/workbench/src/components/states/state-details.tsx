import React from 'react'
import JsonView from 'react18-json-view'
import { StateItem } from './hooks/states-hooks'

type Props = {
  state: StateItem
}

export const StateDetails: React.FC<Props> = ({ state }) => <JsonView src={state.value} theme="default" />
