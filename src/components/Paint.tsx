import React, { useRef } from 'react';

// Interface to hold properties for this component.
interface PaintProps {
    width: number, height: number,
    lineWidth: number,
    smoothness: number,
    thinning?: number // Optional
}

// Interface to avoid having to type { x: number, y: number } everywhere.
interface Coord {
    x: number, y: number
}

function drawLine(context: CanvasRenderingContext2D,
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

function drawLineFromCoordPath(context: CanvasRenderingContext2D,
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

function drawCurveFromCoordPath(context: CanvasRenderingContext2D,
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

function undrawFromCoordPath(context: CanvasRenderingContext2D,
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

function undo(context: CanvasRenderingContext2D,
              coordPathStack: [Coord[], number][]) {
    undrawFromCoordPath(context, coordPathStack.pop());
}

function Paint(props: PaintProps) {
    const canvasRef = useRef(null);
    const isDrawing = useRef(false);

    // To track the mouse position
    const mousePos: React.MutableRefObject<Coord> = useRef({ x: 0, y:0 });

    // A tuple of a list of mouse positions and a number to represent the width
    // of the line being drawn.
    const currentCoordPath:
        React.MutableRefObject<[Coord[], number]> = useRef([[], props.lineWidth]);
    // A stack of mouse position lists, which track the path taken by the mouse
    const coordPathStack:
        React.MutableRefObject<[Coord[], number][]> = useRef([]);

    // TODO: Move <canvas> event handlers into separate functions. All those
    //       .currents are ugly :'(
    return (
        <canvas
            width={props.width}
            height={props.height}
            ref={canvasRef}
            style={{border: '1px solid black'}}
            onMouseDown = {e => {
                // Only proceed if the left mouse is pressed
                if (e.button != 0) return;

                const canvas = canvasRef.current;
                const bounds = canvas.getBoundingClientRect();

                // Calculate the mouse position relative to the <canvas> element.
                mousePos.current = { x: e.clientX - bounds.left, 
                                     y: e.clientY - bounds.top };
                isDrawing.current = true;
                currentCoordPath.current[0] = [ mousePos.current ];
            }}
            onMouseUp = {e => {
                // Only proceed if the left mouse is pressed
                if (e.button != 0) return;

                mousePos.current = { x: 0, y: 0 };
                isDrawing.current = false;

                if (currentCoordPath.current[0].length == 0) return;

                // Erase the drawn line and redraw a curve approximation.
                const context: CanvasRenderingContext2D = canvasRef.current.getContext('2d');
                undrawFromCoordPath(context, currentCoordPath.current);
                // Uncomment this and comment drawCurveFromCoordPath to redraw the exact line drawn by the user.
                // (Note: this is still apparently un-antialiased for some reason :( )
                // drawLineFromCoordPath(context, currentCoordPath.current);
                drawCurveFromCoordPath(context, currentCoordPath.current, props.smoothness, props.thinning);

                // Weird quirk: this doesn't work:
                // coordPathStack.current.push(currentCoordPath.current);
                // But this does:
                coordPathStack.current.push([currentCoordPath.current[0], currentCoordPath.current[1]]);
                // Chrome prints to the console asynchronously,
                // so it might just be an effect of that.

                // Reset the path
                currentCoordPath.current[0] = []
            }}
            onMouseMove = {e => {
                // Only proceed if the left mouse is pressed
                if (e.button != 0) return;

                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');
                const bounds = canvas.getBoundingClientRect();

                if (isDrawing.current) {
                    const end: Coord = { x: e.clientX - bounds.left,
                                         y: e.clientY - bounds.top };
                    drawLine(context, mousePos.current, end, props.lineWidth);

                    currentCoordPath.current[0].push(end);
                    mousePos.current = end;
                }
            }}
            >
        </canvas>
    )
}

export default Paint;
