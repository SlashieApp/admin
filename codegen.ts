import 'dotenv/config'
import type { CodegenConfig } from '@graphql-codegen/cli'

const graphqlOrigin = (
  process.env.NEXT_PUBLIC_GRAPHQL_URL?.trim() || 'https://api.slashie.app'
).replace(/\/$/, '')

const schemaToken = process.env.SCHEMA_ACCESS_TOKEN?.trim() || ''

/**
 * Prefer live Apollo SDL (`${origin}/schema` + X-Schema-Token) when
 * SCHEMA_ACCESS_TOKEN is set. Otherwise use the local BE-43/44/46 contract.
 */
const config: CodegenConfig = {
  schema: schemaToken
    ? [
        {
          [`${graphqlOrigin}/schema`]: {
            headers: {
              'X-Schema-Token': schemaToken,
            },
            handleAsSDL: true,
          },
        },
      ]
    : 'schema/admin.graphql',
  documents: ['src/graphql/**/*.ts'],
  ignoreNoDocuments: true,
  generates: {
    '.codegen/schema.ts': {
      plugins: ['typescript', 'typescript-operations'],
      config: {
        useTypeImports: true,
        skipTypename: true,
      },
    },
  },
}

export default config
