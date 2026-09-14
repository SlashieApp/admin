import Image from 'next/image'

import { slashieWordmarkSrc, type BrandSurface } from '@/lib/brand'

type Props = {
  surface: BrandSurface
  className?: string
}

export function BrandLogo({ surface, className }: Props) {
  return (
    <Image
      src={slashieWordmarkSrc(surface)}
      alt="Slashie"
      width={148}
      height={34}
      className={className ?? 'brand-logo'}
      unoptimized
      priority
    />
  )
}
