import { describe, expect, it } from 'vitest'

import {
  parseTaskDossierTab,
  taskDossierPath,
} from './taskDossier'

describe('parseTaskDossierTab', () => {
  it('defaults to overview', () => {
    expect(parseTaskDossierTab(null)).toBe('overview')
    expect(parseTaskDossierTab('nope')).toBe('overview')
  })

  it('accepts dossier sections', () => {
    expect(parseTaskDossierTab('quotes')).toBe('quotes')
    expect(parseTaskDossierTab('activity')).toBe('activity')
    expect(parseTaskDossierTab('admin')).toBe('admin')
  })
})

describe('taskDossierPath', () => {
  it('omits the default overview tab from the URL', () => {
    expect(taskDossierPath('abc')).toBe('/tasks/abc')
    expect(taskDossierPath('abc', 'overview')).toBe('/tasks/abc')
    expect(taskDossierPath('abc', 'admin')).toBe('/tasks/abc?tab=admin')
  })
})
