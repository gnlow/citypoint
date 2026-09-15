import {
    CityPoint,
    Dist,
    Plane,
} from "./mod.ts"
import * as oklch from "https://gnlow.dev/oklch@0.1.3"

const cityPoint = new CityPoint({
    w: 40,
    h: 20,
})

await Deno.writeFile("mod.png",
    cityPoint.valuePlane.map(n => Math.log(n || 1)/6*255)
    .grayscale().upscale(10).toPng()
)

const hue = Dist.range(0, 360)
const tweak = Dist.n(0, 0.01)
const light = Dist.f(x => 0.5+x*0.3)

const res: Plane<[number, number, number, number]> = cityPoint.districtPlane
    .map(v => v?.toReversed())
    .map(v =>
        [...oklch.rgb(
            light.pick(""+v![1])
            +tweak.pick(""+v![2]),
            v!.length < 3
                ? 0.05
                : 0.1,
            hue.pick(""+v![0]),
        ), 255]
    )
await Deno.writeFile("district.png",
    res.upscale(10).toPng()
)

const districts = cityPoint.getDistricts()

console.log(districts.map(x => x.length))

districts[3].forEach(kingdom => {
    console.log(`Kingdom ${kingdom.name}: ${kingdom.population}`)
    kingdom.children.forEach(duchy => {
        console.log(`  Duchy ${duchy.name}: ${duchy.population}`)
        duchy.children.forEach(barony => {
            console.log(`    Barony ${barony.name}: ${barony.population}`)
        })
    })
})

districts[2].filter(x => !x.liege).forEach(duchy => {
    console.log(`Free Duchy ${duchy.name}: ${duchy.population}`)
    duchy.children.forEach(barony => {
        console.log(`  Barony ${barony.name}: ${barony.population}`)
    })
})

districts[1].filter(x => !x.liege).forEach(barony => {
    console.log(`Free Barony ${barony.name}: ${barony.population}`)
})

import { render } from "./src/web.ts"
await Deno.writeTextFile("district.svg", render(cityPoint))
