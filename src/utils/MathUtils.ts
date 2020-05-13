// Interface to avoid having to type { x: number, y: number } everywhere.
export interface Coord {
    x: number, y: number
}

export function distance(a: Coord, b: Coord): number {
    return Math.hypot(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}
