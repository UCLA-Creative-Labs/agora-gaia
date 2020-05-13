import { Coord, distance } from './MathUtils';

// Interface to hold properties for this component.
export interface PaintProps {
    width: number, height: number,
    lineWidth: number,
    smoothness: number,
    thinning?: number,      // Optional
    colors?: string[],      // Optional
    maxStrokeLen?: number   // Optional
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
    // context.strokeStyle = 'black'; // TODO: Move out of this method
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

export function undo(context: CanvasRenderingContext2D,
                     coordPathStack: CoordPath[],
                     smoothness: number, thinning: number = 0) {
    let stackSize = coordPathStack.length;
    if (stackSize <= 0) return;

    undrawCurveFromCoordPath(context, coordPathStack.pop(), smoothness, -1);

    stackSize = coordPathStack.length;
    if (stackSize > 0)
        drawCurveFromCoordPath(
            context,
            coordPathStack[stackSize - 1],
            smoothness, thinning
        );
}
