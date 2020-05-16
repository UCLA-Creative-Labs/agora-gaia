import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';

import ColorButtons from './ColorButtons';
import DrawControls from './DrawControls';

import {
    PaintProps,
    Side, CoordPath,
    drawLine,
    drawLineFromCoordPath, drawCurveFromCoordPath,
    undrawLineFromCoordPath, undrawCurveFromCoordPath,
    drawAllCurvesFromStack,
    drawFromBuffer
} from '../utils/PaintUtils';
import {
    Coord, distance, outOfBounds
} from '../utils/MathUtils';
import sock, * as SocketUtils from '../utils/SocketUtils';

import './styles/Paint.scss';

function Paint(props: PaintProps) {
    // State variables
    const [ canvas, setCanvas ] = useState<HTMLCanvasElement>(null);
    const [ buffer, setBuffer ] = useState<HTMLCanvasElement>(document.createElement('canvas'));
    const [ canvasOffset, setCanvasOffset ] = useState<Coord>({
        x: props.maxWidth / 2 - props.width / 2,
        y: props.maxHeight / 2 - props.height / 2
    });

    const [ context, setContext ] = useState<CanvasRenderingContext2D>(null);
    const [ stack, setStack ] = useState<CoordPath[]>([]);
    const [ cannotDraw, setCannotDraw ] = useState<boolean>(props.cannotDraw);
    const toggleCannotDraw = () => { setCannotDraw(!cannotDraw); }

    const canvasRef = useCallback(ref => { if (ref !== null) { setCanvas(ref); } }, [setCanvas]);

    // Check whether the user is currently drawing
    const isDrawing: React.MutableRefObject<boolean> = useRef(false);
    // Check whether the user is currently panning
    const isPanning: React.MutableRefObject<boolean> = useRef(false);

    // To track the mouse position
    const mousePos: React.MutableRefObject<Coord> = useRef({ x: 0, y: 0 });
    // To track the length of the current coord path
    const coordPathLen: React.MutableRefObject<number> = useRef(0);
    // Track what the canvas looks like on pan (faster than redrawing)
    const imageDataRef: React.MutableRefObject<ImageData> = useRef(null);
    // Track pan translation amount
    const tlate: React.MutableRefObject<Coord> = useRef({ x: 0, y: 0 });

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

        buffer.width = props.maxWidth;
        buffer.height = props.maxHeight;

        drawAllCurvesFromStack(context, stack,
                               props.smoothness, props.thinning);
    }, [canvas]);

    useEffect(() => {
        const bufferContext = buffer.getContext('2d');
        if (!context || !bufferContext) return;

        SocketUtils.handlePackage((data: CoordPath[]) => {
            setStack(data);
            drawAllCurvesFromStack(bufferContext, data,
                props.smoothness, props.thinning);
            drawFromBuffer(context, canvas, canvasOffset, buffer);
        });

        SocketUtils.handleStroke((data: CoordPath) => {
            setStack(prevStack => [...prevStack, data]);
            drawCurveFromCoordPath(bufferContext, data,
                props.smoothness, props.thinning);
            drawFromBuffer(context, canvas, canvasOffset, buffer);
        });

    }, [context]);

    const onResize = () => {
        drawAllCurvesFromStack(buffer.getContext('2d'), stack, props.smoothness, props.thinning);
        drawFromBuffer(context, canvas, canvasOffset, buffer);
    };

    useEffect(() => {
        window.addEventListener('resize', onResize);

        return () => {
            window.removeEventListener('resize', onResize);
        };
    }, [context, canvas, buffer]);

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
                        if (e.button != 0) return;

                        if (cannotDraw) {
                            canvas.style.cursor = 'grabbing';

                            isPanning.current = true;
                            return;
                        }

                        const bounds = canvas.getBoundingClientRect();

                        // Calculate the mouse position relative to the buffer
                        mousePos.current = { x: e.clientX - bounds.left + canvasOffset.x,
                                             y: e.clientY - bounds.top  + canvasOffset.y};
                        isDrawing.current = true;
                        currentCoordPath.current.pos = [ mousePos.current ];
                        coordPathLen.current = 0;
                    }}
                    onMouseUp = {e => {
                        // Only proceed if the left mouse is pressed and isDrawing
                        if (e.button != 0 || !isDrawing) return;

                        if (cannotDraw) {
                            canvas.style.cursor = 'grab';
                            isPanning.current = false;
                            return;
                        }

                        const bufferContext = buffer.getContext('2d');

                        mousePos.current = { x: 0, y: 0 };
                        isDrawing.current = false;

                        if (currentCoordPath.current.pos.length == 0) return;

                        // Rerendering the whole stack is expensive, so do this only if explicitly directed.
                        if (props.rerenderAll) {
                            bufferContext.clearRect(0, 0, buffer.width, buffer.height);
                            drawAllCurvesFromStack(bufferContext, stack, props.smoothness, props.thinning);
                        } else {
                            undrawLineFromCoordPath(bufferContext, currentCoordPath.current);
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
                        drawCurveFromCoordPath(bufferContext, currentCoordPath.current,
                                               props.smoothness, props.thinning);

                        setStack(prevStack => [...prevStack, data]);

                        // Reset the path
                        currentCoordPath.current.pos = []
                        drawFromBuffer(context, canvas, canvasOffset, buffer);
                    }}
                    onMouseMove = {e => {
                        if (cannotDraw) {
                            canvas.style.cursor = 'grab';
                        } else canvas.style.cursor = 'auto';

                        // Only proceed if the left mouse is pressed
                        if (e.button != 0) return;

                        if (!isDrawing.current && !isPanning.current) return;

                        if (cannotDraw && isPanning.current) {
                            canvas.style.cursor = 'grabbing';
                            canvasOffset.x -= e.movementX;
                            canvasOffset.y -= e.movementY;
                            if (outOfBounds(canvasOffset, { sx: 0, sy: 0, width: buffer.width, height: buffer.height })) {
                                canvasOffset.x += e.movementX;
                                canvasOffset.y += e.movementY;
                            }
                        } else {
                            // const canvas = canvasRef.current;
                            const bounds = canvas.getBoundingClientRect();
                            const bufferContext = buffer.getContext('2d');

                            if (isDrawing.current) {
                                const end: Coord = { x: e.clientX - bounds.left + canvasOffset.x,
                                                     y: e.clientY - bounds.top  + canvasOffset.y};
                                bufferContext.strokeStyle = currentCoordPath.current.color;
                                drawLine(bufferContext, mousePos.current, end, currentCoordPath.current.width);

                                currentCoordPath.current.pos.push(end);
                                coordPathLen.current += distance(mousePos.current, end);

                                if (props.maxStrokeLen && coordPathLen.current >= props.maxStrokeLen) {
                                    canvas.dispatchEvent(new MouseEvent('mouseup', {
                                        bubbles: true, cancelable: true
                                    }));
                                }

                                mousePos.current = end;
                            }
                        }
                        drawFromBuffer(context, canvas, canvasOffset, buffer);
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
                    paintProps={props}
                    callbacks={[toggleCannotDraw]}/>
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
