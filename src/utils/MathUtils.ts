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

export function outOfBoundsX(x: number, bounds: Rect): boolean {
    return x < bounds.sx || x > bounds.sx + bounds.width;
}

export function outOfBoundsY(y: number, bounds: Rect): boolean {
    return y < bounds.sy || y > bounds.sy + bounds.height;
}

export function rectOutOfBoundsX(rect: Rect, bounds: Rect): boolean {
    return outOfBoundsX(rect.sx, bounds)
            || outOfBoundsX(rect.sx + rect.width, bounds);
}

export function rectOutOfBoundsY(rect: Rect, bounds: Rect): boolean {
    return outOfBoundsY(rect.sy, bounds)
            || outOfBoundsY(rect.sy + rect.height, bounds);
}

export function millisToMinSec(millis: number): string {
    const min = Math.floor(millis / 60000);
    const sec = Math.floor(millis / 1000) % 60 - min + 1;
    const minStr = min.toString().padStart(2, '0');
    const secStr = sec.toString().padStart(2, '0');
    return `${minStr}:${secStr}`;
}
