import { Coord, distance } from './MathUtils';

// Interface to hold properties for this component.
export interface PaintProps {
    width: number, height: number,
    lineWidth: number,

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

export interface CoordPath {
    pos: Coord[], width: number, color?: string
}

export function drawLine(context: CanvasRenderingContext2D,
                         start: Coord, end: Coord,
                         lineWidth: number) {
    context.beginPath();
    context.lineWidth = lineWidth;
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
    context.closePath();
}

export function drawLineFromCoordPath(context: CanvasRenderingContext2D,
                           coordPath: CoordPath) {
    context.beginPath();
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

export function drawCurveFromCoordPath(context: CanvasRenderingContext2D,
                                       coordPath: CoordPath,
                                       smoothness: number, thinning: number = 0) {
    context.beginPath();
    context.strokeStyle = coordPath.color;
    context.lineWidth = coordPath.width - thinning;
    let i;
    const num_coords = coordPath.pos.length;
    // This algorithm takes the average of two consecutive points and uses them
    // as the points to draw the resulting line. The actual coordinates serve
    // as control points.
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

export function drawAllCurvesFromStack(context: CanvasRenderingContext2D,
                                       coordPathStack: CoordPath[],
                                       smoothness: number, thinning: number = 0) {
    coordPathStack.forEach(coordPath => {
        drawCurveFromCoordPath(context, coordPath, smoothness, thinning);
    });
}

export function undo(canvas: HTMLCanvasElement,
                     coordPathStack: CoordPath[],
                     rerenderAll: boolean,
                     smoothness: number, thinning: number = 0) {
    let stackSize = coordPathStack.length;
    if (stackSize <= 0) return;

    const context = canvas.getContext('2d');

    if (rerenderAll) {
        coordPathStack.pop();
        context.clearRect(0, 0, canvas.width, canvas.height);
        drawAllCurvesFromStack(context, coordPathStack,
                               smoothness, thinning);
    } else {
        undrawCurveFromCoordPath(context, coordPathStack.pop(),
                                 smoothness, -1);
        stackSize = coordPathStack.length;
        if (stackSize > 0)
            drawCurveFromCoordPath(
                context,
                coordPathStack[stackSize - 1],
                smoothness, thinning
            );
    }
}
