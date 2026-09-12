import { Plane } from "https://gnlow.dev/plane@0.1.3"
import { Dist } from "https://raw.esm.sh/gh/gnlow/disty@0.5.0/mod.ts"
import { arr, mod } from "https://gnlow.dev/util@0.1.2"

export const grow =
(n = 100) =>
(plane: Plane<number>) => {
    arr(n).forEach(i => {
        const x0 = Dist.range(0, plane.w).pick(""+i)
        const y0 = Dist.range(0, plane.h).pick(""+i)
        const x1 = Dist.n(x0, plane.w/2).map(x => mod(Math.floor(x), plane.w)).pick(""+i)
        const y1 = Dist.n(x0, plane.w/2).map(x => mod(Math.floor(x), plane.w)).pick(""+i)
        const cnt = Dist.poisson(plane.get([x0, y0])!/10).pick(""+i)*10
        
        plane.add([x1, y1], cnt+1)
    })
}

const plane = new Plane<number>(10, 10)

arr(10).forEach(x => arr(10).forEach(y =>
    plane.add([x, y], 1)
))

grow(700)(plane)

console.log(plane.raw.values().toArray().toSorted((a, b)=>b-a))
