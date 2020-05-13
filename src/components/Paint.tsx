import React, { useRef } from 'react';

import {
    PaintProps, Coord, CoordPath,
    drawLine,
    drawLineFromCoordPath, drawCurveFromCoordPath,
    undrawLineFromCoordPath, undrawCurveFromCoordPath,
    undo
} from '../utils/PaintUtils';
import './styles/Paint.scss';

import UndoImg from '../assets/icons/undo-black-18dp.svg';

function Paint(props: PaintProps) {
    const canvasRef = useRef(null);
    const isDrawing = useRef(false);

    // To track the mouse position
    const mousePos: React.MutableRefObject<Coord> = useRef({ x: 0, y:0 });

    // A tuple of a list of mouse positions and a number to represent the width
    // of the line being drawn.
    const currentCoordPath:
        React.MutableRefObject<CoordPath> = useRef({
            pos: [], width: props.lineWidth, color: 'black'
        });
    // A stack of mouse position lists, which track the path taken by the mouse
    const coordPathStack:
        React.MutableRefObject<CoordPath[]> = useRef([]);

    // TODO: Move <canvas> event handlers into separate functions. All those
    //       .currents are ugly :'(
    return (
        <div
            style={{'width': '100%', 'height': '100%', 'display': 'inline-block', 'textAlign': 'center'}}>
            <canvas
                width={props.width}
                height={props.height}
                ref={canvasRef}
                id='paint-canvas'
                onMouseDown = {e => {
                    // Only proceed if the left mouse is pressed
                    if (e.button != 0) return;

                    const canvas = canvasRef.current;
                    const bounds = canvas.getBoundingClientRect();

                    // Calculate the mouse position relative to the <canvas> element.
                    mousePos.current = { x: e.clientX - bounds.left, 
                                         y: e.clientY - bounds.top };
                    isDrawing.current = true;
                    currentCoordPath.current.pos = [ mousePos.current ];
                }}
                onMouseUp = {e => {
                    // Only proceed if the left mouse is pressed
                    if (e.button != 0) return;

                    mousePos.current = { x: 0, y: 0 };
                    isDrawing.current = false;

                    if (currentCoordPath.current.pos.length == 0) return;

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
                    coordPathStack.current.push({
                        pos: currentCoordPath.current.pos,
                        width: currentCoordPath.current.width,
                        color: currentCoordPath.current.color
                    });

                    // Reset the path
                    currentCoordPath.current.pos = []
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

                        currentCoordPath.current.pos.push(end);
                        mousePos.current = end;
                    }
                }}>
            </canvas>
            <button
                onClick = {_ => {
                    const context = canvasRef.current.getContext('2d');
                    undo(context, coordPathStack.current, props.smoothness);
                }}
                className='side-btn'
                id='undo-btn'>
                <img src={UndoImg} style={{'width':'30px', 'height':'30px'}}/>
            </button>
            <br />
            <button
                onClick = {_ => {
                    const context: CanvasRenderingContext2D = canvasRef.current.getContext('2d');
                    context.strokeStyle = 'black';
                    currentCoordPath.current.color = 'black';
                }}
                className='side-btn color-btn'
                id='blk-btn'>
            </button>
            <button
                onClick = {_ => {
                    const context: CanvasRenderingContext2D = canvasRef.current.getContext('2d');
                    context.strokeStyle = 'red';
                    currentCoordPath.current.color = 'red';
                }}
                className='side-btn color-btn'
                id='red-btn'>
            </button>
            <button
                onClick = {_ => {
                    const context: CanvasRenderingContext2D = canvasRef.current.getContext('2d');
                    context.strokeStyle = 'green';
                    currentCoordPath.current.color = 'green';
                }}
                className='side-btn color-btn'
                id='green-btn'>
            </button>
            <button
                onClick = {_ => {
                    const context: CanvasRenderingContext2D = canvasRef.current.getContext('2d');
                    context.strokeStyle = 'blue';
                    currentCoordPath.current.color = 'blue';
                }}
                className='side-btn color-btn'
                id='blue-btn'>
            </button>
        </div>
    )
}

export default Paint;
