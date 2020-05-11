import React, { useRef } from 'react';

interface PaintProps {
    width: number, height: number, lineWidth: number
}

function drawLine(context: CanvasRenderingContext2D,
                  start: [number, number], end: [number, number],
                  lineWidth: number) {
    context.beginPath();
    context.strokeStyle = 'black';
    context.lineWidth = lineWidth;
    context.moveTo(start[0], start[1]);
    context.lineTo(end[0], end[1]);
    context.stroke();
    context.closePath();
}

function drawFromCoordPath(context: CanvasRenderingContext2D,
                           coordPath: [[number, number][], number]) {
    context.beginPath();
    context.strokeStyle = 'black';
    context.lineWidth = coordPath[1];
    context.moveTo(coordPath[0][0][0], coordPath[0][0][1]);
    coordPath[0].forEach(coord => {
        context.lineTo(coord[0], coord[1]);
        context.stroke();
        context.moveTo(coord[0], coord[1]);
    });
    context.closePath();
}

function undrawFromCoordPath(context: CanvasRenderingContext2D,
                             coordPath: [[number, number][], number]) {
    const prevStrokeStyle = context.strokeStyle;
    context.globalCompositeOperation = "destination-out";
    context.strokeStyle = 'rgba(0,0,0,1.0)';
    drawFromCoordPath(context, coordPath);
    context.globalCompositeOperation = "source-over";
    context.strokeStyle = prevStrokeStyle;
}

function undo(context: CanvasRenderingContext2D,
              coordPathStack: [[number, number][], number][]) {
    undrawFromCoordPath(context, coordPathStack.pop());
}

function Paint(props: PaintProps) {
    const canvasRef = useRef(null);
    const isDrawing = useRef(false);

    const mousePos: React.MutableRefObject<[number, number]> = useRef([0, 0]);

    // A list of mouse positions, which are stored as a two-element list.
    const currentCoordPath:
        React.MutableRefObject<[[number, number][], number]> = useRef([[], props.lineWidth]);
    // A stack of mouse position lists, which track the path taken by the mouse
    const coordPathStack:
        React.MutableRefObject<[[number, number][], number][]> = useRef([]);

    // TODO: Move <canvas> event handlers into separate functions. All those
    //       .currents are ugly :'(
    return (
        <canvas
            width={props.width}
            height={props.height}
            ref={canvasRef}
            style={{border: '1px solid black'}}
            onMouseDown = {e => {
                // If the left mouse button was not clicked, do nothing
                if (e.button != 0) return;

                const canvas = canvasRef.current;
                const bounds = canvas.getBoundingClientRect();

                mousePos.current = [ e.clientX - bounds.left, 
                                     e.clientY - bounds.top ];
                isDrawing.current = true;
                currentCoordPath.current[0] = [];
            }}
            onMouseUp = {e => {
                if (e.button != 0) return;

                mousePos.current = [ 0, 0 ];
                isDrawing.current = false;

                if (currentCoordPath.current[0].length == 0) return;

                const context: CanvasRenderingContext2D = canvasRef.current.getContext('2d');
                undrawFromCoordPath(context, currentCoordPath.current);
                drawFromCoordPath(context, currentCoordPath.current);

                // Weird quirk: this doesn't work:
                // coordPathStack.current.push(currentCoordPath.current);
                // But this does:
                coordPathStack.current.push([currentCoordPath.current[0], currentCoordPath.current[1]]);
                currentCoordPath.current[0] = []
                console.log(coordPathStack);
            }}
            onMouseMove = {e => {
                if (e.button != 0) return;

                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');
                const bounds = canvas.getBoundingClientRect();

                if (isDrawing.current) {
                    currentCoordPath.current[0].push(mousePos.current);

                    const end: [number, number] = [ e.clientX - bounds.left,
                                                    e.clientY - bounds.top ];
                    drawLine(context, mousePos.current, end, props.lineWidth);
                    mousePos.current = end;
                }
            }}
            >
        </canvas>
    )
}

export default Paint;
