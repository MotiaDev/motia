import { getDependenciesFromFile } from '../get-dependencies-from-file'

describe('getDependenciesFromFile', () => {
  test('categorizes dependencies correctly', () => {
    const pythonCode = `
import os
import sys
from collections import defaultdict
import requests
from .local_module import something
from ..parent_module import other
`

    const requirements = {
      requests: 'requests==2.25.1',
    }

    const deps = getDependenciesFromFile(pythonCode, 'test.py', requirements)

    expect(Array.from(deps.standardLibDependencies)).toEqual(['os', 'sys', 'collections'])
    expect(Array.from(deps.externalDependencies)).toEqual(['requests'])
    expect(Array.from(deps.projectDependencies)).toEqual(['.local_module', '..parent_module'])
  })

  test('handles relative imports correctly', () => {
    const pythonCode = 'from ...utils.database import connect'
    const requirements = {}

    const deps = getDependenciesFromFile(pythonCode, 'test.py', requirements)

    expect(Array.from(deps.projectDependencies)).toEqual(['...utils.database'])
  })

  test('handles import statements with requirements dep', () => {
    const pythonCode = `
import json
import numpy 
import mypackage.submodule
`

    const requirements = {
      numpy: 'numpy==1.21.0',
    }

    const deps = getDependenciesFromFile(pythonCode, 'test.py', requirements)

    expect(Array.from(deps.standardLibDependencies)).toEqual(['json'])
    expect(Array.from(deps.externalDependencies)).toEqual(['numpy'])
    expect(Array.from(deps.projectDependencies)).toEqual(['mypackage.submodule'])
  })

  test('handles import statements with requirements dep and alias', () => {
    const pythonCode = `
import json
import numpy as np
import mypackage.submodule
`

    const requirements = {
      numpy: 'numpy==1.21.0',
    }

    const deps = getDependenciesFromFile(pythonCode, 'test.py', requirements)

    expect(Array.from(deps.standardLibDependencies)).toEqual(['json'])
    expect(Array.from(deps.externalDependencies)).toEqual(['numpy'])
    expect(Array.from(deps.projectDependencies)).toEqual(['mypackage.submodule'])
  })

  test('handles empty file', () => {
    const pythonCode = ''
    const requirements = {}

    const deps = getDependenciesFromFile(pythonCode, 'test.py', requirements)

    expect(deps.standardLibDependencies.size).toBe(0)
    expect(deps.externalDependencies.size).toBe(0)
    expect(deps.projectDependencies.size).toBe(0)
  })

  test('handles unknown external dependencies as project dependencies', () => {
    const pythonCode = 'import unknown_package'
    const requirements = {}

    const deps = getDependenciesFromFile(pythonCode, 'test.py', requirements)

    expect(Array.from(deps.projectDependencies)).toEqual(['unknown_package'])
  })
})
