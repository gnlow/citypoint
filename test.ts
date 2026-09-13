import {
    Plane,
    arr,
    grow,
    level,
    genTree,
    Dist,
} from "./mod.ts"
import * as oklch from "https://gnlow.dev/oklch@0.1.3"

const w = 40
const h = 20
const plane = new Plane<number>(w, h)

arr(w).forEach(x => arr(h).forEach(y =>
    plane.set([x, y], 100)
))

grow(w*h*10)(plane)

console.log(plane.raw.values().toArray().toSorted((a, b)=>b-a))
await Deno.writeFile("mod.png",
    plane.map(n => Math.log(n || 1)/6*255)
    .grayscale().upscale(10).toPng()
)

const leveled = level([20e4, 80e4, 300e4])(plane)

console.log(genTree(leveled, plane))

const hue = Dist.range(0, 360)
const tweak = Dist.n(0, 0.01)
const light = Dist.f(x => 0.5+x*0.3)

const res: Plane<[number, number, number, number]> = leveled
    .map(v => v?.reverse())
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

