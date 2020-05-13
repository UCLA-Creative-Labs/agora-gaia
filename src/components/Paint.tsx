import React, { useRef } from 'react';

import {
    PaintProps, Coord,
    drawLine,
    drawLineFromCoordPath, drawCurveFromCoordPath,
    undrawLineFromCoordPath, undrawCurveFromCoordPath,
    undo
} from '../utils/PaintUtils';

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
        <div style={{'verticalAlign': 'top', 'display': 'inline-block'}}>
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
                    undrawLineFromCoordPath(context, currentCoordPath.current);
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
                }}>
            </canvas>
            <button
                onClick = {_ => {
                    const context = canvasRef.current.getContext('2d');
                    undo(context, coordPathStack.current, props.smoothness);
                }}>
                Undo
            </button>
        </div>
    )
}

export default Paint;
