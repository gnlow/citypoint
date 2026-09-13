import { Plane } from "https://gnlow.dev/plane@0.1.5"
import { Dist } from "https://raw.esm.sh/gh/gnlow/disty@0.5.0/mod.ts"
import { arr, mod } from "https://gnlow.dev/util@0.1.2"
export { Plane, arr, Dist }

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

export const isNeighbor =
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

export const district =
(max: number) =>
(sections: {
    set: Set<string>,
    sum: number,
}[]) => {
    sections = structuredClone(sections)
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
    return completed
}

export const level =
(maxs: number[]) =>
(plane: Plane<number>) => {
    const sections = plane.raw.entries().toArray()
        .toSorted((a, b) => a[1]-b[1])
        .map(([c, n]) => ({
            set: new Set([c]),
            sum: n,
        }))
    const res = new Plane<number[]>(
        plane.w,
        plane.h,
    ).map(() => [] as number[])
    
    maxs.reduce(
        (sections, max) => {
            const completed = district(max)(sections)
            completed.forEach((section, id) =>
                section.set.values().forEach(c =>
                    res.raw.get(c)!.push(id)
                )
            )
            return completed
        },
        sections,
    )
    return res
}

export const genTree =
(leveled: Plane<number[]>, pop: Plane<number>) => {
    const a = Map.groupBy(leveled.raw.entries().map(([coord, path]) => ({
        path,
        pop: pop.raw.get(coord),
        coord,
    })), x => x.path[0])
    const b = Map.groupBy(a.entries(), x => x[1][0].path[1])
    const c = Map.groupBy(b.entries(), x => x[1][0][1][0].path[2])
    c.entries().forEach(([kingdom, data]) => {
        console.log(`Kingdom ${kingdom}`)
        data.forEach(([duchy, data]) => {
            console.log(`  Duchy ${duchy}`)
            data.forEach(([barony, data]) => {
                console.log(
                    `    Barony ${barony}:`,
                    data.map((o) => {
                        // console.log(`      City ${o.coord}:`, o.pop)
                        return o.pop
                    }).reduce((a, b) => a!+b!),
                )
            })
        })
    })
}

export abstract class District {
    abstract name: string
    abstract population: number
    abstract children: Set<District>
    abstract liege?: District
    abstract level: number
    getChildrenOnLevel(level: number): District[] {
        if (this.level < level+1) return []
        return this.level == level+1
            ? this.children.values().toArray()
            : this.children.values()
                .flatMap(child => child.getChildrenOnLevel(level))
                .toArray()
    }
}

export class Realm extends District {
    constructor(
        public name: string,
        public children: Set<District>,
        public liege?: District,
    ) { super() }
    get population() {
        return this.children.values()
            .map(x => x.population)
            .reduce((a, b) => a+b)
    }
    get level() {
        return this.children.values().toArray()[0].level+1
    }
}

export class City extends District {
    constructor(
        public coordStr: string,
        public population: number,
        public name: string,
        public liege?: District,
    ) { super() }
    children = new Set<District>
    level = 0
}

export class CityPoint {
    readonly w
    readonly h
    readonly levels
    readonly intensity
    readonly valuePlane
    readonly districtPlane
    constructor(o: {
        w: number,
        h: number,
        levels?: number[],
        intensity?: number,
    }) {
        o.levels ??= [20e4, 80e4, 300e4]
        o.intensity ??= 10
        
        const { w, h, levels, intensity } = o
        this.w = o.w
        this.h = o.h
        this.levels = o.levels
        this.intensity = o.intensity
        
        const plane = new Plane<number>(w, h)

        arr(w).forEach(x => arr(h).forEach(y =>
            plane.set([x, y], 100)
        ))
        
        grow(w*h*intensity)(plane)
        
        const leveled = level(levels)(plane)
        
        this.valuePlane = plane
        this.districtPlane = leveled
    }
    getDistricts() {
        const entries = this.districtPlane.raw.entries()
        const cities = [] as City[]
        const districtMaps = this.levels.map((_, i) => new Map<number, District>)
        entries.forEach(([coord, path]) => {
            const city = new City(coord, this.valuePlane.raw.get(coord)!, coord)
            cities.push(city)
            path.reverse().forEach((id, level) => {
                const liege = districtMaps[level]?.getOrInsert(id, new Realm(""+id, new Set))
                const child = 
                    districtMaps[level-1]?.getOrInsert(path[level-1], new Realm(""+path[level-1], new Set))
                    ?? city
                child.liege = liege
                liege.children.add(child)
            })
        })
        return [
            cities,
            ...districtMaps.map(x => x.values().toArray())
        ]
    }
}
