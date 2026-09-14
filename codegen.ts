import 'dotenv/config'
import type { CodegenConfig } from '@graphql-codegen/cli'

const graphqlOrigin = (
  process.env.NEXT_PUBLIC_GRAPHQL_URL?.trim() || 'https://api.slashie.app'
).replace(/\/$/, '')

/**
 * Codegen against the live Apollo SDL (`${origin}/schema`).
 * Requires SCHEMA_ACCESS_TOKEN (`X-Schema-Token`).
 *
 * To use the local BE-42 contract instead:
 *   schema: 'schema/admin.graphql'
 */
const config: CodegenConfig = {
  schema: [
    {
      [`${graphqlOrigin}/schema`]: {
        headers: {
          'X-Schema-Token': process.env.SCHEMA_ACCESS_TOKEN || '',
        },
        handleAsSDL: true,
      },
    },
  ],
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
