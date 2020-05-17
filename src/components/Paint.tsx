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
    drawFromBuffer,
    panCanvas,
    stackIncludesPath
} from '../utils/PaintUtils';
import {
    Coord, distance,
    outOfBoundsX, outOfBoundsY,
    rectOutOfBoundsX, rectOutOfBoundsY
} from '../utils/MathUtils';
import {
    isLocalStorageAvailable
} from '../utils/StorageUtils';
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
    const [ handshake, setHandshake ] = useState<SocketUtils.Handshake>({last_send: null, can_undo: false});
    const [ limit, setLimit] = useState(120000);
    const popStack = () => { setStack(prevStack => prevStack.slice(0,-1)); };
    const [ isStackEmpty, setIsStackEmpty ] = useState(true);
    const [ cannotDraw, setCannotDraw ] = useState<boolean>(props.cannotDraw);
    const toggleCannotDraw = () => { setCannotDraw(!cannotDraw); }
    const [ canToggle, setCanToggle ] = useState(true);

    const canvasRef = useCallback(ref => { if (ref !== null) { setCanvas(ref); } }, [setCanvas]);

    // Check whether the user is currently drawing
    const isDrawing = useRef(false);
    // Check whether the user is currently panning
    const isPanning = useRef(false);

    // To track the mouse position
    const mousePos = useRef<Coord>({ x: 0, y: 0 });
    // To track touch position
    const touchPos = useRef<Coord>({ x: 0, y: 0});
    // To track the length of the current coord path
    const coordPathLen = useRef(0);
    // Track what the canvas looks like on pan (faster than redrawing)
    const imageDataRef = useRef<ImageData>(null);
    // Track pan translation amount
    const tlate = useRef<Coord>({ x: 0, y: 0 });

    // A tuple of a list of mouse positions and a number to represent the width
    // of the line being drawn.
    const currentCoordPath = useRef<CoordPath>({
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
        setIsStackEmpty(stack.length == 0);
        if (!isLocalStorageAvailable() || stack.length == 0) return;

        const storage = window.localStorage;
        storage.setItem('stack', JSON.stringify(stack));
    }, [stack]);

    useEffect(() => {
        const bufferContext = buffer.getContext('2d');
        if (!context || !bufferContext || !isStackEmpty) return;

        const localStack: CoordPath[] = JSON.parse(window.localStorage.getItem('stack')) || [];
        if (localStack.length > 0) {
            setStack(localStack);
            drawAllCurvesFromStack(bufferContext, localStack, props.smoothness, props.thinning);
        }

        SocketUtils.handleDrawLimit((limit: number) => {
            setLimit(limit);
        });

        SocketUtils.handleHandshake((data: SocketUtils.Handshake) => {
            setHandshake(data);
            
            const time_diff = Date.now() - data.last_send;

            if(data.last_send && time_diff < limit){
                setCannotDraw(true);
                setCanToggle(false);
                setTimeout(() => {
                    setCannotDraw(false);
                    setCanToggle(true);
                }, limit - time_diff)
            }
        })

        SocketUtils.handlePackage((data: CoordPath[]) => {
            const neededData = data.filter(p => !stackIncludesPath(p, localStack));

            setStack(prevStack => [...prevStack, ...neededData]);

            drawAllCurvesFromStack(bufferContext, neededData,
                props.smoothness, props.thinning);
            drawFromBuffer(context, canvas, canvasOffset, buffer);
        });

        SocketUtils.handleStroke((data: CoordPath) => {
            setStack(prevStack => [...prevStack, data]);
            drawCurveFromCoordPath(bufferContext, data,
                props.smoothness, props.thinning);
            drawFromBuffer(context, canvas, canvasOffset, buffer);
        });

        // FOR RESETING LOCAL STORAGE MAYBE DO THIS TWICE A DAY?
        SocketUtils.reset((data: any) => {
            setStack([]);
            if (!isLocalStorageAvailable()) return;
            const storage = window.localStorage;
            storage.setItem('stack', JSON.stringify([]));
            console.log(storage);
        })

    }, [canvas, context, isStackEmpty]);

    const onResize = () => {
        const bufferRect = { sx: 0, sy: 0, width: buffer.width, height: buffer.height };

        if (outOfBoundsX(canvasOffset.x, bufferRect))
            canvasOffset.x = bufferRect.sx - canvasOffset.x;
        if (outOfBoundsX(canvasOffset.x + canvas.width, bufferRect))
            canvasOffset.x = bufferRect.sx + bufferRect.width - canvas.width;

        if (outOfBoundsY(canvasOffset.y, bufferRect))
            canvasOffset.y = bufferRect.sy - canvasOffset.y;
        if (outOfBoundsY(canvasOffset.y + canvas.width, bufferRect))
            canvasOffset.y = bufferRect.sy + bufferRect.height - canvas.height;

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
                        } else canvas.style.cursor = 'crosshair';

                        // Only proceed if the left mouse is pressed
                        if (e.button != 0) return;

                        if (!isDrawing.current && !isPanning.current) return;

                        if (cannotDraw && isPanning.current) {
                            canvas.style.cursor = 'grabbing';
                            const movement = { x: e.movementX, y: e.movementY };
                            panCanvas(canvas, buffer, canvasOffset, movement);
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
                    onTouchStart = {e => {
                        e.preventDefault();
                        touchPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                    }}
                    onTouchEnd = {e => {
                        e.preventDefault();
                    }}
                    onTouchMove = {e => {
                        e.preventDefault();
                        const lastTouchPos: Coord = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                        const deltaX = lastTouchPos.x - touchPos.current.x;
                        const deltaY = lastTouchPos.y - touchPos.current.y;
                        touchPos.current = lastTouchPos;

                        const movement = { x: deltaX, y: deltaY };

                        panCanvas(canvas, buffer, canvasOffset, movement);
                        drawFromBuffer(context, canvas, canvasOffset, buffer);
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
                    bufferContext={buffer.getContext('2d')}
                    buffer={buffer}
                    canvasOffset={canvasOffset}
                    currentCoordPath={currentCoordPath.current}
                    coordPathStack={stack}
                    cannotDraw={cannotDraw}
                    canToggle={canToggle}
                    paintProps={props}
                    toggleCannotDraw={toggleCannotDraw}
                    popStack={popStack}/>
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
