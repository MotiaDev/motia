import React from 'react'

import { render, screen } from '@testing-library/react'
import { LogField } from './log-field'

jest.mock('../../lib/utils', () => ({
  cn: jest.fn((...args) => args.filter(Boolean).join(' ')),
}))

describe('LogField', () => {
  describe('renders with string values', () => {
    it('renders with a simple string value', () => {
      render(<LogField label="Test Label" value="Test Value" />)

      expect(screen.getByText('Test Label')).toBeInTheDocument()
      expect(screen.getByText('Test Value')).toBeInTheDocument()
      expect(screen.getByLabelText('Test Value')).toBeInTheDocument()
    })

    it('renders with empty string value', () => {
      render(<LogField label="Empty Label" value="" />)

      expect(screen.getByText('Empty Label')).toBeInTheDocument()
      expect(screen.getByLabelText('')).toBeInTheDocument()
    })
  })

  describe('renders with React node values', () => {
    it('renders with a React node value', () => {
      const reactNodeValue = <span data-testid="react-node">React Node Value</span>
      render(<LogField label="React Node Label" value={reactNodeValue} />)

      expect(screen.getByText('React Node Label')).toBeInTheDocument()
      expect(screen.getByTestId('react-node')).toBeInTheDocument()
      expect(screen.getByText('React Node Value')).toBeInTheDocument()
    })

    it('renders with complex React node', () => {
      const complexNode = (
        <div>
          <span>Nested</span>
          <strong>Content</strong>
        </div>
      )
      render(<LogField label="Complex Node" value={complexNode} />)

      expect(screen.getByText('Complex Node')).toBeInTheDocument()
      expect(screen.getByText('Nested')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('renders with object values', () => {
    it('renders with a simple object value', () => {
      const objectValue = { key1: 'value1', key2: 'value2' }
      render(<LogField label="Object Label" value={objectValue} />)

      expect(screen.getByText('Object Label')).toBeInTheDocument()
      expect(screen.getByText('key1')).toBeInTheDocument()
      expect(screen.getByText('value1')).toBeInTheDocument()
      expect(screen.getByLabelText('value1')).toBeInTheDocument()
      expect(screen.getByText('key2')).toBeInTheDocument()
      expect(screen.getByText('value2')).toBeInTheDocument()
      expect(screen.getByLabelText('value2')).toBeInTheDocument()
    })

    it('renders with nested object value', () => {
      const objectValue = {
        key1: 'value1',
        key2: { nestedKey: 'nestedValue' },
      }
      render(<LogField label="Nested Object Label" value={objectValue} />)

      expect(screen.getByText('Nested Object Label')).toBeInTheDocument()
      expect(screen.getByText('key1')).toBeInTheDocument()
      expect(screen.getByText('value1')).toBeInTheDocument()
      expect(screen.getByText('key2')).toBeInTheDocument()
      expect(screen.getByText('nestedKey')).toBeInTheDocument()
      expect(screen.getByText('nestedValue')).toBeInTheDocument()
      expect(screen.getByLabelText('nestedValue')).toBeInTheDocument()
    })

    it('renders object with numeric values', () => {
      const objectValue = { count: 123, price: 45.67 }
      render(<LogField label="Numeric Object" value={objectValue} />)

      expect(screen.getByText('Numeric Object')).toBeInTheDocument()
      expect(screen.getByText('count')).toBeInTheDocument()
      expect(screen.getByText('123')).toBeInTheDocument()
      expect(screen.getByLabelText('123')).toBeInTheDocument()
      expect(screen.getByText('price')).toBeInTheDocument()
      expect(screen.getByText('45.67')).toBeInTheDocument()
      expect(screen.getByLabelText('45.67')).toBeInTheDocument()
    })

    it('renders object with boolean values', () => {
      const objectValue = { isActive: true, isComplete: false }
      render(<LogField label="Boolean Object" value={objectValue} />)

      expect(screen.getByText('Boolean Object')).toBeInTheDocument()
      expect(screen.getByText('isActive')).toBeInTheDocument()
      expect(screen.getByText('true')).toBeInTheDocument()
      expect(screen.getByLabelText('true')).toBeInTheDocument()
      expect(screen.getByText('isComplete')).toBeInTheDocument()
      expect(screen.getByText('false')).toBeInTheDocument()
      expect(screen.getByLabelText('false')).toBeInTheDocument()
    })

    it('renders object with null and undefined values', () => {
      const objectValue = { nullValue: null, undefinedValue: undefined }
      render(<LogField label="Null/Undefined Object" value={objectValue} />)

      expect(screen.getByText('Null/Undefined Object')).toBeInTheDocument()
      expect(screen.getByText('nullValue')).toBeInTheDocument()
      expect(screen.getByText('null')).toBeInTheDocument()
      expect(screen.getByLabelText('null')).toBeInTheDocument()
      expect(screen.getByText('undefinedValue')).toBeInTheDocument()
      // Note: undefined values render as empty divs, not the text "undefined"
    })
  })

  describe('renders with null and undefined values', () => {
    it('renders correctly when value is null', () => {
      render(<LogField label="Null Label" value={null} />)

      expect(screen.getByText('Null Label')).toBeInTheDocument()
      expect(screen.getByText('null')).toBeInTheDocument()
      expect(screen.getByLabelText('null')).toBeInTheDocument()
    })

    it('renders correctly when value is undefined', () => {
      render(<LogField label="Undefined Label" value={undefined} />)

      expect(screen.getByText('Undefined Label')).toBeInTheDocument()
      // Note: undefined values render as empty divs, not the text "undefined"
    })
  })

  describe('renders with primitive values', () => {
    it('renders with number value', () => {
      render(<LogField label="Number Label" value={42} />)

      expect(screen.getByText('Number Label')).toBeInTheDocument()
      expect(screen.getByText('42')).toBeInTheDocument()
      expect(screen.getByLabelText('42')).toBeInTheDocument()
    })

    it('renders with boolean value', () => {
      render(<LogField label="Boolean Label" value={true} />)

      expect(screen.getByText('Boolean Label')).toBeInTheDocument()
      expect(screen.getByText('true')).toBeInTheDocument()
      expect(screen.getByLabelText('true')).toBeInTheDocument()
    })

    it('renders with zero value', () => {
      render(<LogField label="Zero Label" value={0} />)

      expect(screen.getByText('Zero Label')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument()
      expect(screen.getByLabelText('0')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('renders with array value (treated as object)', () => {
      const arrayValue = ['item1', 'item2', 'item3']
      render(<LogField label="Array Label" value={arrayValue} />)

      expect(screen.getByText('Array Label')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument()
      expect(screen.getByText('item1')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('item2')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('item3')).toBeInTheDocument()
    })

    it('renders with empty object', () => {
      render(<LogField label="Empty Object" value={{}} />)

      expect(screen.getByText('Empty Object')).toBeInTheDocument()
      // Should render the object container but no keys
    })

    it('renders with deeply nested object', () => {
      const deepObject = {
        level1: {
          level2: {
            level3: 'deep value',
          },
        },
      }
      render(<LogField label="Deep Object" value={deepObject} />)

      expect(screen.getByText('Deep Object')).toBeInTheDocument()
      expect(screen.getByText('level1')).toBeInTheDocument()
      expect(screen.getByText('level2')).toBeInTheDocument()
      expect(screen.getByText('level3')).toBeInTheDocument()
      expect(screen.getByText('deep value')).toBeInTheDocument()
    })
  })
})
