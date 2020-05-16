import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';

import ColorButtons from './ColorButtons';
import DrawControls from './DrawControls';

import {
    PaintProps,
    Side, CoordPath,
    drawLine,
    drawLineFromCoordPath, drawCurveFromCoordPath,
    undrawLineFromCoordPath, undrawCurveFromCoordPath,
    drawAllCurvesFromStack
} from '../utils/PaintUtils';
import {
    Coord, distance
} from '../utils/MathUtils';
import sock, * as SocketUtils from '../utils/SocketUtils';
import {
    getData,
    postData,
} from '../utils/Hooks';

import './styles/Paint.scss';

function Paint(props: PaintProps) {
    // State variables
    const [ canvas, setCanvas ] = useState(null);
    const [ context, setContext ] = useState(null);
    const [ stack, setStack ] = useState([]);

    const canvasRef = useCallback(ref => { if (ref !== null) { setCanvas(ref); } }, [setCanvas]);

    // Check whether the user is currently drawing
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

    // If the element doesn't have a colors property, default to black + RGB
    const colors: string[] = props.colors || [ 'black', 'red', 'green', 'blue' ]

    useEffect(() => {
        // setCanvas(canvasRef.current);
        if (!canvas) return;
        const context = canvas.getContext('2d');
        setContext(context);

        drawAllCurvesFromStack(context, stack,
                               props.smoothness, props.thinning);
    }, [canvas]);

    useEffect(() => {
        if (!context) return;

        SocketUtils.handlePackage((data: CoordPath[]) => {
            setStack(data);
            drawAllCurvesFromStack(context, data,
                props.smoothness, props.thinning);
        });

        SocketUtils.handleStroke((data: CoordPath) => {
            setStack(prevStack => [...prevStack, data]);
            drawCurveFromCoordPath(context, data,
                props.smoothness, props.thinning);
        });

    }, [context]);

    useEffect(() => {
        const onResize = () => {
            console.log(stack);
            drawAllCurvesFromStack(context, stack, props.smoothness, props.thinning);
        };

        window.addEventListener('resize', onResize);

        return () => {
            window.removeEventListener('resize', onResize);
        };
    });

    return (
        <div id='all-wrapper'>
            <div id='canvas-wrapper'>
                <DrawControls
                    side={Side.Left}
                    currentCoordPath={currentCoordPath.current} />
                <canvas
                    width={props.width}
                    height={props.height}
                    ref={canvasRef}
                    id='paint-canvas'
                    onMouseDown = {e => {
                        // Only proceed if the left mouse is pressed
                        if (e.button != 0 || props.cannotDraw) return;

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

                        // Rerendering the whole stack is expensive, so do this only if explicitly directed.
                        if (props.rerenderAll) {
                            context.clearRect(0, 0, canvas.width, canvas.height);
                            drawAllCurvesFromStack(context, stack, props.smoothness, props.thinning);
                        } else {
                            undrawLineFromCoordPath(context, currentCoordPath.current);
                        }
                        // Uncomment this and comment drawCurveFromCoordPath to redraw the exact
                        // line drawn by the user.
                        // (Note: this is still apparently un-antialiased for some reason :( )
                        // drawLineFromCoordPath(context, currentCoordPath.current);
                        const data: CoordPath = {
                            pos: currentCoordPath.current.pos,
                            width: currentCoordPath.current.width,
                            color: currentCoordPath.current.color
                        };
                        SocketUtils.sendStroke(data);
                        drawCurveFromCoordPath(context, currentCoordPath.current,
                                               props.smoothness, props.thinning);

                        setStack(prevStack => [...prevStack, data]);

                        // Reset the path
                        currentCoordPath.current.pos = []
                    }}
                    onMouseMove = {e => {
                        // Only proceed if the left mouse is pressed
                        if (e.button != 0 || !isDrawing || props.cannotDraw) return;

                        // const canvas = canvasRef.current;
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
                            canvas.dispatchEvent(new MouseEvent('mouseup', {
                                bubbles: true, cancelable: true
                            }));
                    }}
                    onWheel={e => {
                        // TODO: Use e.deltaY to zoom into the canvas?
                    }}>
                    {'Your browser doesn\'t support <canvas> elements :('}
                </canvas>
                <DrawControls
                    side={Side.Right}
                    context={context}
                    canvas={canvas}
                    currentCoordPath={currentCoordPath.current}
                    coordPathStack={stack}
                    paintProps={props}/>
            </div>
            <br />
            <ColorButtons
                context={context}
                currentCoordPath={currentCoordPath.current}
                colors={colors} />
        </div>
    )
}

export default Paint;
