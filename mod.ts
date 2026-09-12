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

const district =
(max: number) =>
(plane: Plane<number>) => {
    const sections: {
        set: Set<string>,
        sum: number,
    }[] = []
    
    let entries = plane.raw.entries().toArray()
        .toSorted((a, b) => a[1]-b[1])
    
    while (entries.length) {
        const proposals = sections.map((section, sectionId) =>
            new Set(section.set.values().flatMap(coordStr => {
                const [x, y] = coordStr.split(";").map(Number)
                return [
                    [x+1, y],
                    [x, y+1],
                    [x-1, y],
                    [x, y-1],
                ]
                .filter(([x, y]) =>
                       0 <= x && x < plane.w
                    && 0 <= y && y < plane.h
                )
                .map(x => x.join(";"))
            })).difference(section.set)
            .values()
            .map(coordStr => ({
                sectionId,
                coordStr,
                sum: section.sum+plane.raw.get(coordStr)!,
            }))
            .toArray()
            .toSorted((a, b) => a.sum-b.sum)[0]
        ).toSorted((a, b) => a.sum-b.sum)
        
        if (proposals.length && proposals[0].sum < entries[0][1] && proposals[0].sum <= max) {
            const { sectionId, coordStr, sum } = proposals[0]
            sections[sectionId].set.add(coordStr)
            sections[sectionId].sum = sum
            entries = entries.filter(([c]) => c != coordStr)
        } else {
            const nu = entries.shift()!
            sections.push({
                set: new Set([nu[0]]),
                sum: nu[1],
            })
        }
    }
    const dis = new Plane<[number, number, number, number]>(plane.w, plane.h)
    sections.forEach(section => {
        const color = [...arr(3).map(x => Math.floor(Math.random()*255)), 255] as [number, number, number, number]
        section.set.values().forEach(coordStr => {
            dis.raw.set(coordStr, color)
        })
    })
    return dis
}

const res = district(100000)(plane)
await Deno.writeFile("district.png",
    res.upscale(10).toPng()
)
