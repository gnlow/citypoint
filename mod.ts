import { Plane } from "https://gnlow.dev/plane@0.1.4"
import { Dist } from "https://raw.esm.sh/gh/gnlow/disty@0.5.0/mod.ts"
import { arr, mod } from "https://gnlow.dev/util@0.1.2"

export const grow =
(n = 100) =>
(plane: Plane<number>) => {
    arr(n).forEach(i => {
        const x0 = Dist.range(0, plane.w).pick(""+i)
        const y0 = Dist.range(0, plane.h).pick(""+i)
        const x1 = Dist.n(x0, 3).map(x => mod(Math.floor(x), plane.w)).pick(""+i)
        const y1 = Dist.n(y0, 3).map(y => mod(Math.floor(y), plane.h)).pick(""+i)
        const cnt = plane.get([x0, y0])!
            * Dist.ll(0.9, 1).pick(""+i)
        
        plane.add([x1, y1], Math.floor(cnt*0.5))
    })
}

const plane = new Plane<number>(20, 20)

arr(20).forEach(x => arr(20).forEach(y =>
    plane.set([x, y], 100)
))

grow(4000)(plane)

console.log(plane.raw.values().toArray().toSorted((a, b)=>b-a))
await Deno.writeFile("mod.png",
    plane.map(n => Math.log(n || 1)/6*255)
    .grayscale().upscale(10).toPng()
)
