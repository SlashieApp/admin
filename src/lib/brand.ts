export type BrandSurface = 'dark' | 'light'

/**
 * Official wordmark SVGs from SlashieApp/web.
 * light.svg = green mark + black wordmark (for light surfaces)
 * dark.svg  = green mark + white wordmark (for dark surfaces)
 */
export function slashieWordmarkSrc(surface: BrandSurface): string {
  return surface === 'dark'
    ? '/images/slashie-logo-dark.svg'
    : '/images/slashie-logo-light.svg'
}

export function slashieMarkSrc(): string {
  return '/images/slashie-mark.svg'
}
