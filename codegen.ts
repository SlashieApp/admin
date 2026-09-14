import type { CodegenConfig } from '@graphql-codegen/cli'

/**
 * Codegen against the local BE-42 contract (`schema/admin.graphql`).
 * Existing Task / worker / auth types match live apollo introspection
 * (https://api.slashie.app/graphql). Admin fields are the proposed BE-42 API.
 *
 * To regenerate from a live schema instead:
 *   schema: [{ [`${process.env.NEXT_PUBLIC_GRAPHQL_URL}/schema`]: { headers: { 'X-Schema-Token': process.env.SCHEMA_ACCESS_TOKEN || '' }, handleAsSDL: true } }]
 */
const config: CodegenConfig = {
  schema: 'schema/admin.graphql',
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
