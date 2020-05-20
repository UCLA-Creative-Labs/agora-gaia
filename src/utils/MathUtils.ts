// Interface to store a coordinate on screen.
export interface Coord {
    x: number, y: number
}

// Interace describing a rectangle
export interface Rect {
    sx: number, sy: number, width: number, height: number
}

// Calculate the Euclidean distance between two coordinates.
export function distance(a: Coord, b: Coord): number {
    return Math.hypot(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

// Returns true if x is beyond the horizontal bounds of the supplied Rect
export function outOfBoundsX(x: number, bounds: Rect): boolean {
    return x < bounds.sx || x > bounds.sx + bounds.width;
}

// Returns true if y is beyond the vertical bounds of the supplied Rect
export function outOfBoundsY(y: number, bounds: Rect): boolean {
    return y < bounds.sy || y > bounds.sy + bounds.height;
}

// Returns true if rect is not completely horizontally contained in bounds
export function rectOutOfBoundsX(rect: Rect, bounds: Rect): boolean {
    return outOfBoundsX(rect.sx, bounds)
            || outOfBoundsX(rect.sx + rect.width, bounds);
}

// Returns true if rect is not completely vertically contained in bounds
export function rectOutOfBoundsY(rect: Rect, bounds: Rect): boolean {
    return outOfBoundsY(rect.sy, bounds)
            || outOfBoundsY(rect.sy + rect.height, bounds);
}

// Express a millisecond value in mm:ss form.
export function millisToMinSec(millis: number): string {
    const min = Math.floor(millis / 60000);
    const sec = Math.floor(millis / 1000) % 60;
    const minStr = min.toString().padStart(2, '0');
    const secStr = sec.toString().padStart(2, '0');
    return `${minStr}:${secStr}`;
}
