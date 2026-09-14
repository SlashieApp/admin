export type BrandSurface = 'dark' | 'light'

/**
 * Official wordmark SVGs copied from SlashieApp/web `public/images/`.
 * light.svg = green mark + black wordmark (light cards)
 * dark.svg  = green mark + white wordmark (dark nav)
 */
export function slashieWordmarkSrc(surface: BrandSurface): string {
  return surface === 'dark'
    ? '/images/slashie-logo-dark.svg'
    : '/images/slashie-logo-light.svg'
}

export function slashieMarkSrc(): string {
  return '/images/slashie-mark.svg'
}
