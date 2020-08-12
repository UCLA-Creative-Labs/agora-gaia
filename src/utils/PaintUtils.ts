import {
    Coord, distance, clamp,
    rectOutOfBoundsX, rectOutOfBoundsY
} from './MathUtils';

// Used to differentiate between left and right.
export enum Side {
    Left, Right
}

// Interface describing an on-screen path in terms of the coordinates which
// lie on it.
export interface CoordPath {
    pos: Coord[], width: number,
    color?: string // Optional
}


// Interface to hold properties for this component.
export interface PaintProps {
    width: number, height: number,
    maxWidth: number, maxHeight: number,
    lineWidth: number,

    connected: () => void, loaded: () => void,

    // Line smoothing/thinning is a global property, not user defined, so
    // they are handled at the canvas level, not the stroke level
    smoothness: number,
    thinning?: number,      // Optional (null treated as 0)
    colors?: string[],      // Optional (null must be explicitly handled)
    maxStrokeLen?: number,  // Optional (null treated as infinite)

    // For use with server to prevent user from drawing.
    cannotDraw?: boolean,

    // If enabled, the canvas will redraw all previous strokes when drawing
    // a new one. This is expensive (especially as the stack size grows very
    // large) so enable sparingly.
    rerenderAll?: boolean   // Optional (null treated as false)
}

// Interface to hold properties of the whole canvas with the purpose of being
// passed to children so all components are aware of canvas state. Could be
// done more cleanly, but whatever.
export interface CanvasProps {
    context?: CanvasRenderingContext2D,         // The canvas context
    canvas?: HTMLCanvasElement,                 // The canvas itself
    bufferContext?: CanvasRenderingContext2D,   // The offscreen buffer canvas' context
    buffer?: HTMLCanvasElement,                 // The offscreen buffer itself
    canvasOffset?: Coord,                       // The offset of the canvas' top left corner
                                                //  from that of the buffer canvas
    canvasScale?: number,                       // The scale of the canvas
    currentCoordPath?: CoordPath,               // The path for the stroke being draw
    coordPathStack?: CoordPath[],               // The overall stack of paths
    cannotDraw?: boolean,                       // True if the user is to be prevented from drawing
    colors?: string[],                          // A list of possible stroke colors
    paintProps?: PaintProps,                    // Holds the properties of the Pain component
    popStack?: () => void                       // A function specifically for popping the stroke stack
                                                //  in the parent
}

// Interface to hold properties for draw control buttons (e.g. undo, toggle).
export interface DrawControlProps {
    side: Side,                     // The side of the canvas on which the controls are placed
    toggleCannotDraw?: () => void,  // Toggles a state variable in the parent
    canToggle?: boolean,            // True if the user is permitted to toggle between drawing and panning
    canUndo?: boolean               // True if the user is allowed to undo their last stroke
}

// Interface to hold properties for the onscreen timer.
export interface TimerProps {
    limit: number,      // The number of seconds a user must wait before drawing a new stroke
    lastSend: number    // The timestamp of the user's last-drawn stroke
}

// Draw a line of width lineWidth on context between start and end.
export function drawLine(context: CanvasRenderingContext2D,
                         start: Coord, end: Coord,
                         lineWidth: number) {
    context.beginPath();
    context.lineCap = 'round';
    context.lineWidth = lineWidth;
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
    context.closePath();
}

// Draw a line on context defined by the path described by coordPath.
export function drawLineFromCoordPath(context: CanvasRenderingContext2D,
                           coordPath: CoordPath) {
    context.beginPath();
    context.lineCap = 'round';
    context.strokeStyle = coordPath.color;
    context.lineWidth = coordPath.width;
    context.moveTo(coordPath.pos[0].x, coordPath.pos[0].y);
    coordPath.pos.forEach(coord => {
        context.lineTo(coord.x, coord.y);
        context.stroke();
        context.moveTo(coord.x, coord.y);
    });
    context.closePath();
}

// Draw a curve on context defined by coordPath with smoothness and thinning as defined.
// The curve is specifically a quadratic Bezier curve. The average between one coordinate
// and the "next" is the endpoint of the curve, while the first coordinate is the control
// point; this achieves a smooth, connected curve.
//
// Smoothness defines the number of points to skip when taking the average mentioned above;
// a higher smoothness results in a smoother curve that also deviates more significantly
// from the original path.
// Thinning defines the amount by which to shrink the resulting curve
export function drawCurveFromCoordPath(context: CanvasRenderingContext2D,
                                       coordPath: CoordPath,
                                       smoothness: number, thinning: number = 0) {
    if (smoothness <= 0) {
        drawLineFromCoordPath(context, coordPath);
        return;
    }

    context.beginPath();
    context.lineCap = 'round';
    context.strokeStyle = coordPath.color;
    context.lineWidth = coordPath.width - thinning;
    let i;
    const num_coords = coordPath.pos.length;

    for (i = 0; i < num_coords; i += smoothness) {
        const coord = coordPath.pos[i],
              // Math.min avoids overstepping the bounds of coordPath[0]
              nextCoord = coordPath.pos[Math.min(i + smoothness, num_coords - 1)];
        let x_next_avg = (coord.x + nextCoord.x) / 2,
            y_next_avg = (coord.y + nextCoord.y) / 2;
        context.quadraticCurveTo(coord.x, coord.y, x_next_avg, y_next_avg);
        context.stroke();
    }
    context.closePath();
}

// Draws over a line-stroke defined by coordPath on context with a destination-out composite
// operation. This effectively erases anything on context which lies underneath coordPath.
export function undrawLineFromCoordPath(context: CanvasRenderingContext2D,
                                        coordPath: CoordPath) {
    // Save state of context so we can revert with no difficulties
    context.save();
    // This flag makes sure whatever is drawn is destructive
    context.globalCompositeOperation = "destination-out";
    // Expand the line with a tad to make sure there's no residue
    context.lineWidth = coordPath.width + 1;
    drawLineFromCoordPath(context, coordPath);
    // Restore the previous state of the context
    context.restore();
}

// Draws over a curve-stroke defined by coordPath on context with a destination-out composite
// operation. This effectively erases anything on context which lies underneath coordPath.
export function undrawCurveFromCoordPath(context: CanvasRenderingContext2D,
                                         coordPath: CoordPath,
                                         smoothness: number, thinning: number = 0) {
    // Save state of context so we can revert with no difficulties
    context.save();
    // This flag makes sure whatever is drawn is destructive
    context.globalCompositeOperation = "destination-out";
    // Expand the line with a tad to make sure there's no residue
    drawCurveFromCoordPath(context, coordPath, smoothness, thinning);
    // Restore the previous state of the context
    context.restore();
}

// Iterates through the entire stroke stack defined by coordPathStack and draws each
// curve-stroke on context.
export function drawAllCurvesFromStack(context: CanvasRenderingContext2D,
                                       coordPathStack: CoordPath[],
                                       smoothness: number, thinning: number = 0) {
    coordPathStack.forEach(coordPath => {
        drawCurveFromCoordPath(context, coordPath, smoothness, thinning);
    });
}

// Undoes a stroke defined by coordPathStack. If rerenderAll is true, then simply
// redraw every stroke on coordPathStack except for the last one. Otherwise, erase
// the last stroke.
export function undo(context: CanvasRenderingContext2D,
                     canvas: HTMLCanvasElement,
                     coordPathStack: CoordPath[],
                     popStack: () => void,
                     rerenderAll: boolean,
                     smoothness: number, thinning: number = 0) {
    let stackSize = coordPathStack.length;
    if (stackSize <= 0) return;

    if (rerenderAll) {
        // If we're rerendering, just redraw everything.
        context.clearRect(0, 0, canvas.width, canvas.height);
        drawAllCurvesFromStack(context, coordPathStack.slice(0,-1),
                               smoothness, thinning);
    } else {
        // Otherwise, undraw the last curve
        undrawCurveFromCoordPath(context, coordPathStack[stackSize - 1],
                                 smoothness, -1);
    }
}

// Draw onto context (and the associated canvas) by reading in the canvas-sized
// section of buffer at the specified offset.
export function drawFromBuffer(context: CanvasRenderingContext2D,
                               canvas: HTMLCanvasElement,
                               offset: Coord,
                               buffer: HTMLCanvasElement,
                               scale: number) {
    const scaledWidth  = canvas.width  * scale,
          scaledHeight = canvas.height * scale;
    const scaledOffset: Coord = getScaledOffset(offset, scale, canvas, buffer);

    // Clear the current canvas and draw a scaled window from the buffer according to
    // the current offset and canvas size.
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(buffer,
                      scaledOffset.x, scaledOffset.y,
                      scaledWidth, scaledHeight,
                      0, 0,
                      canvas.width, canvas.height);
}

// Pan on the canvas by the movement specified by movement. This essentially shifts
// the offset of canvas from the top-left corner of buffer, with some checks to ensure
// that the resulting movement does not place the canvas beyond the bounds of buffer.
export function panCanvas(canvas: HTMLCanvasElement, buffer: HTMLCanvasElement,
                          canvasOffset: Coord, movement: Coord, scale: number) {
    const scaledMovement: Coord = {
        x: movement.x * scale,
        y: movement.y * scale
    }

    canvasOffset.x -= scaledMovement.x;
    canvasOffset.y -= scaledMovement.y;

    const bufferRect = { sx: 0, sy: 0, width: buffer.width, height: buffer.height };
    const canvasRect = { sx: canvasOffset.x, sy: canvasOffset.y,
                         width: canvas.width, height: canvas.height };

    // If the attempted pan results in moving the canvas beyond the buffer's bounds,
    // reverse the offending movement.
    if (rectOutOfBoundsX(canvasRect, bufferRect))
        canvasOffset.x += scaledMovement.x;
    if (rectOutOfBoundsY(canvasRect, bufferRect))
        canvasOffset.y += scaledMovement.y;
}

// Get scaled offset coords
export function getScaledOffset(offset: Coord, scale: number,
                                canvas: HTMLCanvasElement, buffer: HTMLCanvasElement): Coord {
    const scaledWidth  = canvas.width  * scale,
          scaledHeight = canvas.height * scale;
    return {
        x: clamp(offset.x + 0.5 * (canvas.width  - scaledWidth),
                                0, buffer.width - scaledWidth),
        y: clamp(offset.y + 0.5 * (canvas.height - scaledHeight),
                                0, buffer.height - scaledHeight)
    };
}


// Does a deep check to see if two paths are equal. That is, iterates through each
// coordinate in both paths and checks if their x and y fields are equal.
//
// [O(n^2) with n = average path length]
export function coordPathsEqual(path1: CoordPath, path2: CoordPath): boolean {
    if (path1.pos.length != path2.pos.length
        || path1.width != path2.width || path1.color != path2.color)
        return false;

    for (let i = 0; i < path1.pos.length; i++) {
        if (path1.pos[i].x != path2.pos[i].x
           && path1.pos[i].y != path2.pos[i].y) return false;
    }

    return true;
}

// Does a deep check to see if the stack includes a path. That is, iterates through
// each element in coordPathStack and performs the deep check coordPathsEqual on said
// element and path.
//
// [O(mn^2) where m = stack size and n = average path length]
export function stackIncludesPath(path: CoordPath, stack: CoordPath[]) {
    for (let i = 0; i < stack.length; i++) {
        if (coordPathsEqual(path, stack[i])) return true;
    }

    return false;
}
