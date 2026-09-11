import { type Season } from './season'
import { useCurrentSeason } from './useCurrentSeason'
import springVines from '../../assets/seasonal/hero-vines-spring.png'
import summerVines from '../../assets/seasonal/hero-vines-summer.png'
import autumnVines from '../../assets/seasonal/hero_vines_autumn.png'
import winterVines from '../../assets/seasonal/hero_vines_winter.png'

type HeroVineAsset = {
    source: string
    width: number
    height: number
}

const heroVinesBySeason: Record<Season, HeroVineAsset> = {
    spring: { source: springVines, width: 1672, height: 940 },
    summer: { source: summerVines, width: 2035, height: 773 },
    autumn: { source: autumnVines, width: 2035, height: 773 },
    winter: { source: winterVines, width: 2035, height: 773 },
}

export function SeasonalHeroVines() {
    const season = useCurrentSeason()
    const asset = heroVinesBySeason[season]
    const sideBleed = Math.round(asset.width * 0.04)

    return (
        <svg
            className="seasonal-hero-vines"
            data-season={season}
            aria-hidden="true"
            focusable="false"
            preserveAspectRatio="none"
            viewBox={`0 0 ${asset.width + (sideBleed * 2)} ${asset.height}`}
        >
            <image
                href={asset.source}
                x={sideBleed}
                y="0"
                width={asset.width}
                height={asset.height}
            />
        </svg>
    )
}
