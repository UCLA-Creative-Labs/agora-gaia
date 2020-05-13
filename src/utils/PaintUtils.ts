// Interface to hold properties for this component.
export interface PaintProps {
    width: number, height: number,
    lineWidth: number,
    smoothness: number,
    thinning?: number // Optional
}

// Interface to avoid having to type { x: number, y: number } everywhere.
export interface Coord {
    x: number, y: number
}

export function drawLine(context: CanvasRenderingContext2D,
                  start: Coord, end: Coord,
                  lineWidth: number) {
    context.beginPath();
    context.strokeStyle = 'black';
    context.lineWidth = lineWidth;
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
    context.closePath();
}

export function drawLineFromCoordPath(context: CanvasRenderingContext2D,
                           coordPath: [Coord[], number]) {
    context.beginPath();
    context.moveTo(coordPath[0][0].x, coordPath[0][0].y);
    coordPath[0].forEach(coord => {
        context.lineTo(coord.x, coord.y);
        context.stroke();
        context.moveTo(coord.x, coord.y);
    });
    context.closePath();
}

export function drawCurveFromCoordPath(context: CanvasRenderingContext2D,
                                coordPath: [Coord[], number],
                                smoothness: number, thinning: number = 0) {
    context.beginPath();
    context.strokeStyle = 'black'; // TODO: Move out of this method
    context.lineWidth = coordPath[1] - thinning;
    let i;
    const num_coords = coordPath[0].length;
    // This algorithm takes the average of two consecutive points and uses them
    // as the points to draw the resulting line. The actual coordinates serve
    // as control points.
    for (i = 0; i < num_coords; i += smoothness) {
        const coord = coordPath[0][i],
              // Math.min avoids overstepping the bounds of coordPath[0]
              nextCoord = coordPath[0][Math.min(i + smoothness, num_coords - 1)];
        let x_next_avg = (coord.x + nextCoord.x) / 2,
            y_next_avg = (coord.y + nextCoord.y) / 2;
        context.quadraticCurveTo(coord.x, coord.y, x_next_avg, y_next_avg);
        context.stroke();
    }
    context.closePath();
}

export function undrawFromCoordPath(context: CanvasRenderingContext2D,
                             coordPath: [Coord[], number]) {
    // Save state of context so we can revert with no difficulties
    context.save();
    // This flag makes sure whatever is drawn is destructive
    context.globalCompositeOperation = "destination-out";
    // Expand the line with a tad to make sure there's no residue
    context.lineWidth = coordPath[1] + 1;
    drawLineFromCoordPath(context, coordPath);
    // Restore the previous state of the context
    context.restore();
}

export function undo(context: CanvasRenderingContext2D,
              coordPathStack: [Coord[], number][]) {
    undrawFromCoordPath(context, coordPathStack.pop());
}

