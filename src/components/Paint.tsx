import React, { useRef, useEffect } from 'react';

import {
    PaintProps, CoordPath,
    drawLine,
    drawLineFromCoordPath, drawCurveFromCoordPath,
    undrawLineFromCoordPath, undrawCurveFromCoordPath,
    drawAllCurvesFromStack,
    undo
} from '../utils/PaintUtils';
import {
    Coord, distance
} from '../utils/MathUtils';

import './styles/Paint.scss';

import UndoImg from '../assets/icons/undo-black-18dp.svg';
import ZoomInImg from '../assets/icons/add-black-18dp.svg';
import ZoomOutImg from '../assets/icons/remove-black-18dp.svg';

function Paint(props: PaintProps) {
    // Note: can't use useState or useEffect because <canvas> doesn't keep re-rendering
    //       like other elements.
    const canvasRef: React.MutableRefObject<HTMLCanvasElement> = useRef(null);
    const isDrawing: React.MutableRefObject<boolean> = useRef(false);

    // To track the mouse position
    const mousePos: React.MutableRefObject<Coord> = useRef({ x: 0, y:0 });
    // To track the length of the current coord path
    const coordPathLen: React.MutableRefObject<number> = useRef(0);

    // A tuple of a list of mouse positions and a number to represent the width
    // of the line being drawn.
    const currentCoordPath:
        React.MutableRefObject<CoordPath> = useRef({
            pos: [], width: props.lineWidth, color: 'black'
        });
    // A stack of mouse position lists, which track the path taken by the mouse
    const coordPathStack:
        React.MutableRefObject<CoordPath[]> = useRef([]);

    // If the element doesn't have a colors property, default to black + RGB
    const colors: string[] = props.colors || [ 'black', 'red', 'green', 'blue' ]

    useEffect(() => {
        const context = canvasRef.current.getContext('2d');

        // TODO: Renormalize coordinates for canvas dimensions if necessary
        drawAllCurvesFromStack(context, coordPathStack.current,
                               props.smoothness, props.thinning);
    });

    // TODO: Move <canvas> event handlers into separate functions. All those
    //       .currents are ugly :'(
    // TODO: Move buttons into separate components. As it stands this is too cluttered.
    return (
        <div id='all-wrapper'>
            <div id='canvas-wrapper'>
                <span id='draw-controls'>
                    <button
                        onClick = {_ => {
                            if (currentCoordPath.current.width <= 12)
                                currentCoordPath.current.width += 1;
                        }}
                        className='side-btn'
                        id='zoomin-btn'>
                        <img src={ZoomInImg} style={{'width':'30px', 'height':'30px'}}/>
                    </button>
                    <button
                        onClick = {_ => {
                            if (currentCoordPath.current.width > 1)
                                currentCoordPath.current.width -= 1;
                        }}
                        className='side-btn'
                        id='zoomout-btn'>
                        <img src={ZoomOutImg} style={{'width':'30px', 'height':'30px'}}/>
                    </button>
                </span>
                <canvas
                    width={props.width}
                    height={props.height}
                    ref={canvasRef}
                    id='paint-canvas'
                    onMouseDown = {e => {
                        // Only proceed if the left mouse is pressed
                        if (e.button != 0 || props.cannotDraw) return;

                        const canvas = canvasRef.current;
                        const bounds = canvas.getBoundingClientRect();

                        // Calculate the mouse position relative to the <canvas> element.
                        mousePos.current = { x: e.clientX - bounds.left, 
                                             y: e.clientY - bounds.top };
                        isDrawing.current = true;
                        currentCoordPath.current.pos = [ mousePos.current ];
                        coordPathLen.current = 0;
                    }}
                    onMouseUp = {e => {
                        // Only proceed if the left mouse is pressed and isDrawing
                        if (e.button != 0 || !isDrawing || props.cannotDraw) return;

                        mousePos.current = { x: 0, y: 0 };
                        isDrawing.current = false;

                        if (currentCoordPath.current.pos.length == 0) return;

                        // Erase the drawn line and redraw a curve approximation.
                        const context = canvasRef.current.getContext('2d');

                        // Rerendering the whole stack is expensive, so do this only if explicitly directed.
                        if (props.rerenderAll) {
                            context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                            drawAllCurvesFromStack(context, coordPathStack.current, props.smoothness, props.thinning);
                        } else {
                            undrawLineFromCoordPath(context, currentCoordPath.current);
                        }
                        // Uncomment this and comment drawCurveFromCoordPath to redraw the exact
                        // line drawn by the user.
                        // (Note: this is still apparently un-antialiased for some reason :( )
                        // drawLineFromCoordPath(context, currentCoordPath.current);
                        drawCurveFromCoordPath(context, currentCoordPath.current,
                                               props.smoothness, props.thinning);

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
                        if (e.button != 0 || !isDrawing || props.cannotDraw) return;

                        const canvas = canvasRef.current;
                        const context = canvas.getContext('2d');
                        const bounds = canvas.getBoundingClientRect();

                        const mouseScreenPos = { x: e.clientX, y: e.clientY };

                        if (isDrawing.current) {
                            const end: Coord = { x: e.clientX - bounds.left,
                                                 y: e.clientY - bounds.top };
                            drawLine(context, mousePos.current, end, currentCoordPath.current.width);

                            currentCoordPath.current.pos.push(end);
                            coordPathLen.current += distance(mousePos.current, end);

                            if (props.maxStrokeLen && coordPathLen.current >= props.maxStrokeLen) {
                                canvas.dispatchEvent(new MouseEvent('mouseup', {
                                    bubbles: true, cancelable: true
                                }));
                            }

                            mousePos.current = end;
                        }
                    }}
                    onMouseLeave = {e => {
                        if (isDrawing.current)
                            canvasRef.current.dispatchEvent(new MouseEvent('mouseup', {
                                bubbles: true, cancelable: true
                            }));
                    }}
                    onWheel={e => {
                        // TODO: Use e.deltaY to zoom into the canvas?
                    }}>
                    {'Your browser doesn\'t support <canvas> elements :('}
                </canvas>
                <span id='draw-controls'>
                    <button
                        onClick = {_ => {
                            const context = canvasRef.current.getContext('2d');
                            undo(canvasRef.current, coordPathStack.current,
                                 props.rerenderAll, props.smoothness);
                            context.strokeStyle = currentCoordPath.current.color;
                            context.lineWidth = currentCoordPath.current.width;
                        }}
                        className='side-btn'
                        id='undo-btn'>
                        <img src={UndoImg} style={{'width':'30px', 'height':'30px'}}/>
                    </button>
                </span>
            </div>
            <br />
            <div id='color-btns'>
                {colors.map(color => {
                    return (
                        <button
                            key = {color+'-btn'}
                            onClick = {_ => {
                                const context = canvasRef.current.getContext('2d');
                                context.strokeStyle = color;
                                currentCoordPath.current.color = color;
                            }}
                            className = 'color-btn'
                            style = {{ 'background': color }}/>
                    );
                })}
            </div>
        </div>
    )
}

export default Paint;
