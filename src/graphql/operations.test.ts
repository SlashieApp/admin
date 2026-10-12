import { readFileSync } from 'node:fs'

import { buildSchema, validate, type DocumentNode } from 'graphql'
import { describe, expect, it } from 'vitest'

import * as operations from './operations'

// schema/admin.graphql is the live Apollo SDL snapshot. Refresh it from
// `${NEXT_PUBLIC_GRAPHQL_URL}/schema` whenever apollo changes, then run this.
const schema = buildSchema(
  readFileSync(new URL('../../schema/admin.graphql', import.meta.url), 'utf8'),
  { assumeValidSDL: true },
)

describe('operations match schema/admin.graphql', () => {
  it.each(Object.entries(operations))('%s', (_name, document) => {
    const errors = validate(schema, document as DocumentNode)
    expect(errors.map((error) => error.message)).toEqual([])
  })
})
