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

const isNeighbor =
(a: Set<string>, b: Set<string>): boolean =>
    a.size <= b.size
        ? 0 < new Set(a.values().flatMap(s => {
            const [x, y] = s.split(";").map(Number)
            return [
                [x+1, y],
                [x, y+1],
                [x-1, y],
                [x, y-1],
            ].map(l => l.join(";"))
        })).intersection(b).size
        : isNeighbor(b, a)

const district =
(max: number) =>
(plane: Plane<number>) => {
    let sections: {
        set: Set<string>,
        sum: number,
    }[] = plane.raw.entries().toArray()
        .toSorted((a, b) => a[1]-b[1])
        .map(([c, n]) => ({
            set: new Set([c]),
            sum: n,
        }))
    
    const completed: {
        set: Set<string>,
        sum: number,
    }[] = []
    
    while (1 < sections.length) {
        const index = Dist.range(0, sections.length).pick(Dist.getKey())
        const target = sections[index]
        sections = sections.filter((_, i) => i != index)
        const index2 = sections.findIndex(section => isNeighbor(target.set, section.set))
        if (index2 == -1) {
            completed.push(target)
            continue
        }
        const toMerge = sections[index2]
        if (max < target.sum+toMerge.sum) {
            completed.push(target)
            continue
        }
        sections = sections.filter((_, i) => i != index2)
        const merged = {
            set: target.set.union(toMerge.set),
            sum: target.sum+toMerge.sum,
        }
        const newIndex = sections.findIndex(section => section.sum > merged.sum)
        sections.splice(newIndex, 0, merged)
    }
    const dis = new Plane<[number, number, number, number]>(plane.w, plane.h)
    completed.forEach(section => {
        const color = [...arr(3).map(x => Math.floor(Math.random()*255)), 255] as [number, number, number, number]
        section.set.values().forEach(coordStr => {
            dis.raw.set(coordStr, color)
        })
    })
    return dis
}

const res = district(800000)(plane)
await Deno.writeFile("district.png",
    res.upscale(10).toPng()
)
