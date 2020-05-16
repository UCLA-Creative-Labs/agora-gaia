// Interface to avoid having to type { x: number, y: number } everywhere.
export interface Coord {
    x: number, y: number
}

export interface Rect {
    sx: number, sy: number, width: number, height: number
}

export function distance(a: Coord, b: Coord): number {
    return Math.hypot(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

export function outOfBounds(p: Coord, bounds: Rect): boolean {
    return p.x < bounds.sx
        || p.y < bounds.sy 
        || p.x > bounds.sx + bounds.width
        || p.y > bounds.sy + bounds.height;
}
