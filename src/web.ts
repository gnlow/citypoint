import { CityPoint, City, Dist, Realm } from "../mod.ts"
import { pipe, mod } from "https://gnlow.dev/util@0.1.2"

const getBorders =
(realm: Realm) => pipe(
    realm.getChildrenOnLevel(0).map(x => (x as City).coordStr),
    coordStrs => coordStrs.map(s => {
        const [x, y] = s.split(";").map(Number)
        return [
            [x+0.5, y],
            [x, y+0.5],
            [x-0.5, y],
            [x, y-0.5],
        ].map(l => l.join(";"))
    }),
    x => x.reduce((a, b) => a.symmetricDifference(new Set(b)), new Set<string>)
        .values().toArray(),
    x => {
        const map = new Map<string, string[]>
        x.forEach(coordStr => {
            const [x, y] = coordStr.split(";").map(Number)
            if (mod(x, 1) == 0.5) {
                map.getOrInsert(x+";"+(y-0.5), []).push(x+";"+(y+0.5))
                map.getOrInsert(x+";"+(y+0.5), []).push(x+";"+(y-0.5))
            } else {
                map.getOrInsert((x-0.5)+";"+y, []).push((x+0.5)+";"+y)
                map.getOrInsert((x+0.5)+";"+y, []).push((x-0.5)+";"+y)
            }
        })
        const start = map.keys().take(1).toArray()[0]
        let pos = start
        const path = [pos]
        do {
            const next = map.get(pos)!.filter(x => x != path.at(-2))[0]
            path.push(next)
            pos = next
        } while (pos != start)
        return path
    },
    x => `M${
        x.map(s =>
            s.split(";").map(x => 0.5+Number(x)).join(";")
        ).join("L").replaceAll(";", " ")
    }Z`,
)

export const render =
(cityPoint: CityPoint) => {
    const districts = cityPoint.getDistricts()
    console.log(districts.map(x => x.length))
    return `
    <svg xmlns="http://www.w3.org/2000/svg"
        width="400"
        viewBox="0 0 ${cityPoint.w} ${cityPoint.h}"
    >
        <rect x="0" y="0" width="${cityPoint.w}" height="${cityPoint.h}"
            fill="none"
            stroke="black"
            stroke-width="0.2"
        />
        ${districts[3].map(kingdom => `<path
            d="${getBorders(kingdom)}"
            stroke="black"
            stroke-width="0.2"
            fill="oklch(0.7 0.1 ${Dist.range(0, 360).pick("")})"
        />`).join("")}
        ${districts[2].map(duchy => `<path
            d="${getBorders(duchy)}"
            stroke="black"
            stroke-width="0.1"
            fill="none"
        />`).join("")}
    </svg>
    `
}
