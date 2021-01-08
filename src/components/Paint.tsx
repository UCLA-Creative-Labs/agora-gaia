import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';

import DrawControls from './DrawControls';
import Timer        from './Timer';

import {
    PaintProps,
    Side, CoordPath,
    drawLine,
    drawLineFromCoordPath, drawCurveFromCoordPath,
    undrawLineFromCoordPath, undrawCurveFromCoordPath,
    drawAllCurvesFromStack,
    drawFromBuffer,
    panCanvas,
    getScaledOffset,
    stackIncludesPath
} from '../utils/PaintUtils';
import {
    Coord, distance, clamp,
    outOfBoundsX, outOfBoundsY,
    rectOutOfBoundsX, rectOutOfBoundsY
} from '../utils/MathUtils';
import {
    isLocalStorageAvailable
} from '../utils/StorageUtils';
import { debug } from '../utils/Utils';
import sock, * as SocketUtils from '../utils/SocketUtils';

import './styles/Paint.scss';

// The big boy. The component that holds the canvas itself. Will finish commenting this thoroughly
// later.
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
    const [ limit, setLimit ] = useState(Number.MAX_SAFE_INTEGER);
    const popStack = () => { setStack(prevStack => prevStack.slice(0,-1)); };
    const [ isStackEmpty, setIsStackEmpty ] = useState(true);
    const [ cannotDraw, setCannotDraw ] = useState<boolean>(props.cannotDraw);
    const toggleCannotDraw = () => { setCannotDraw(!cannotDraw); }
    const [ canToggle, setCanToggle ] = useState(true);
    const [ canUndo, setCanUndo ] = useState(false);
    const [ lastSend, setLastSend ] = useState(0);
    const [tutorialPhase, setTutorialPhase] = useState(-1);

    const canvasRef = useCallback(ref => { if (ref !== null) { setCanvas(ref); } }, [setCanvas]);

    // Check whether the user is currently drawing
    const isDrawing = useRef(false);
    // Check whether the user is currently panning
    const isPanning = useRef(false);

    // To track the mouse position
    const mousePos = useRef<Coord>({ x: 0, y: 0 });
    // To track touch position
    const touchPos = useRef<Coord>({ x: 0, y: 0});
    // To track distance between last touches
    const touchDist = useRef(0);
    // To track the length of the current coord path
    const coordPathLen = useRef(0);
    // Track what the canvas looks like on pan (faster than redrawing)
    const imageDataRef = useRef<ImageData>(null);
    // Track pan translation amount
    const tlate = useRef<Coord>({ x: 0, y: 0 });
    // Track zoom scale
    const scale = useRef(1);
    // To calculate maximum zoom-out scale
    const maxScale = useRef(1);

    // A tuple of a list of mouse positions and a number to represent the width
    // of the line being drawn.
    const currentCoordPath = useRef<CoordPath>({
            pos: [], width: props.lineWidth, color: 'black'
        });

    // If the element doesn't have a colors property, default to black + RGB
    const colors: string[] = props.colors || [ 'black', 'red', 'green', 'blue' ]

    const tutorialStorageKey = 'tutorial_shown';

    const sendConnected = () => { props.connected(); }
    const sendLoaded = () => { props.loaded(); }

    const setMaxScale = () => {
        if (canvas.height > canvas.width)
            maxScale.current = props.maxHeight / canvas.height;
        else
            maxScale.current = props.maxWidth / canvas.width;
    }

    const storageHandler = (e: StorageEvent) => {
        if (!document.hasFocus()) {
            debug(`STORAGE: ${e.key}`);
            if (e.key == 'stack') {
                debug('different instance wrote to local storage; locking');
                // setStack(JSON.parse(e.newValue) || []);
                setCannotDraw(true);
                setCanUndo(false);
                setCanToggle(false);
            }
        }
    };

    const onResize = () => {
        const bufferRect = { sx: 0, sy: 0, width: buffer.width, height: buffer.height };

        debug('resizing window');

        if (outOfBoundsX(canvasOffset.x, bufferRect))
            canvasOffset.x = bufferRect.sx - canvasOffset.x;
        if (outOfBoundsX(canvasOffset.x + canvas.width, bufferRect))
            canvasOffset.x = bufferRect.sx + bufferRect.width - canvas.width;

        if (outOfBoundsY(canvasOffset.y, bufferRect))
            canvasOffset.y = bufferRect.sy - canvasOffset.y;
        if (outOfBoundsY(canvasOffset.y + canvas.width, bufferRect))
            canvasOffset.y = bufferRect.sy + bufferRect.height - canvas.height;

        setMaxScale();

        drawFromBuffer(context, canvas, canvasOffset, buffer, scale.current);
    };

    // Called only on component mount
    useEffect(() => {
        const drawLimitHandler = (limit: number) => {
            debug('setting draw limit to ' + limit + ' ms');
            setLimit(limit);
        };

        SocketUtils.registerDrawLimit(drawLimitHandler);

        const resetHandler = (data: any) => {
            debug('resetting stack and local storage');
            setStack([]);
            window.localStorage.clear();
        };

        // FOR RESETING LOCAL STORAGE MAYBE DO THIS TWICE A DAY?
        SocketUtils.registerReset(resetHandler);

        if (!isLocalStorageAvailable()) setTutorialPhase(0);

        const storage = window.localStorage;
        const storedBool = JSON.parse(storage.getItem(tutorialStorageKey));
        if (!storedBool)
          setTutorialPhase(0);

        window.addEventListener('storage', storageHandler);

        return () => {
            window.removeEventListener('storage', storageHandler);
            SocketUtils.unregisterReset(resetHandler);
        }
    }, []);

    useEffect(() => {
        // setCanvas(canvasRef.current);
        if (!canvas) return;

        const context = canvas.getContext('2d');
        setContext(context);

        buffer.width = props.maxWidth;
        buffer.height = props.maxHeight;

        debug('rerendering canvas');

        drawFromBuffer(context, canvas, canvasOffset, buffer, scale.current);
        setMaxScale();
    }, [canvas]);

    useEffect(() => {
        setIsStackEmpty(stack.length == 0);
        if (!isLocalStorageAvailable() || stack.length == 0) return;

        debug('stack changed; updating local storage');
        const storage = window.localStorage;

        const jsonStack = JSON.stringify(stack);

        storage.setItem('stack', jsonStack);
        debug('stackdata length:');
        debug(jsonStack.length * 2);

        storage.setItem('most_recent', Date.now().toString());
    }, [stack]);

    useEffect(() => {
        const bufferContext = buffer.getContext('2d');
        if (!context || !bufferContext) return;
        debug('registering listeners');

        const localStack: CoordPath[] = JSON.parse(window.localStorage.getItem('stack')) || [];
        if (localStack.length > 0) {
            setStack(localStack);

            drawAllCurvesFromStack(bufferContext, localStack, props.smoothness, props.thinning);
            drawFromBuffer(context, canvas, canvasOffset, buffer, scale.current);
        }

        const packageHandler = (data: CoordPath[]) => {
            debug('received package from socket');

            setStack(prevStack => [...prevStack, ...data]);

            drawAllCurvesFromStack(bufferContext, data, props.smoothness, props.thinning);
            drawFromBuffer(context, canvas, canvasOffset, buffer, scale.current);

            sendLoaded();
        };

        const strokeHandler = (data: CoordPath) => {
            debug('detected stroke from server');
            setStack(prevStack => [...prevStack, data]);
            drawCurveFromCoordPath(bufferContext, data, props.smoothness, props.thinning);
            drawFromBuffer(context, canvas, canvasOffset, buffer, scale.current);
        };

        SocketUtils.registerPackage(packageHandler);
        SocketUtils.registerStroke(strokeHandler);

        return () => {
            debug('unregistering listeners');
            // SocketUtils.unregisterDrawLimit(drawLimitHandler);
            // SocketUtils.unregisterHandshake(handshakeHandler);
            SocketUtils.unregisterPackage(packageHandler);
            SocketUtils.unregisterStroke(strokeHandler);
        }
    }, [canvas, context, isStackEmpty, scale.current]);

    useEffect(() => {
        const handshakeHandler = (data: SocketUtils.Handshake) => {
            debug('received handshake from server');
            setHandshake(data);
            setLastSend(data.last_send);
            sendConnected();
        };

        debug('registering handshake listener');
        SocketUtils.registerHandshake(handshakeHandler)

        return () => {
            debug('unregistering handshake listener');
            SocketUtils.unregisterHandshake(handshakeHandler);
        }
    }, [limit]);

    useEffect(() => {
        const time_diff = Date.now() - handshake.last_send;
        debug('limit state: ' + limit);
        debug('time difference: ' + time_diff);
        debug('last send: ' + handshake.last_send);

        if(handshake.last_send > 0 && time_diff < limit){
            debug('remaining time: ' + (limit - time_diff));
            setCannotDraw(true);
            setCanToggle(false);
            setTimeout(() => {
                // setCannotDraw(false);
                setCanToggle(true);
            }, limit - time_diff)
        }
    }, [lastSend, handshake]);

    useEffect(() => {
        window.addEventListener('resize', onResize);

        return () => {
            window.removeEventListener('resize', onResize);
        };
    }, [context, canvas, buffer]);

    const renderPhase = () => {
      let phase;
      switch(tutorialPhase) {
        case 0:
          phase = (<>
            <h1>Welcome to Agora!</h1>
            <h3>Agora is a collaborative canvas, proudly brought to you by Creative Labs.</h3>
            <h3>Here's a quick tutorial on how to use it.</h3>
            <h4 onClick={() => setTutorialPhase(old => old+1)}>Next ➜</h4>
          </>);
          break;
        case 1:
          phase = (<>
            <h2>The Canvas</h2>
            <h3>The Canvas is where you'll create your masterpieces and see others' work as well. You can zoom in or out by scrolling or using the touchpad.
            </h3>
            <h3>
              Each time you draw, you will only be able to draw a single stroke of limited length. Once you finish drawing, you will need to wait some seconds before you can draw another stroke, as indicated by the timer at the top of the page.
            </h3>
            <h4 onClick={() => setTutorialPhase(old => old+1)}>Next ➜</h4>
          </>);
          break;
        case 2:
          phase = (<>
            <h2>Drawing</h2>
            <h3>This is the Draw/Pan Toggle Button.</h3>
            <h3>The paintbrush icon indicates you can draw. Clicking it will switch it to the hand icon, indicating you can now pan across the screen. Use the button to toggle between these two modes.</h3>
            <h4 onClick={() => setTutorialPhase(old => old+1)}>Next ➜</h4>
          </>);
          break;
        case 3:
          phase = (<>
            <h2>Undoing Actions</h2>
            <h3>This is the Undo Button.</h3>
            <h3>If you make a mistake, you'll have a few seconds to undo it before the website locks the stroke into place. Think before you draw and use your turn wisely!</h3>
            <h4 onClick={() => setTutorialPhase(old => old+1)}>Next ➜</h4>
          </>);
          break;
        case 4:
          phase = (<>
            <h2>The Palette</h2>
            <h3>This is the color of your paintbrush.</h3>
            <h3>Click it to display a color picker, where you can choose the perfect color for your needs. Click the button again or click anywhere outside of the color picker window to hide it.</h3>
            <h4 onClick={() => setTutorialPhase(old => old+1)}>Next ➜</h4>
          </>);
          break;
        case 5:
          phase = (<>
            <h2>Brush Size</h2>
            <h3>These are the brush size controls</h3>
            <h3>Use these buttons to increase or decrease the size of your brush.</h3>
            <h4 onClick={() => setTutorialPhase(old => old+1)}>Next ➜</h4>
          </>);
          break;
        case 6:
          phase = (<>
            <h1>Happy drawing!</h1>
            <h4 onClick={() => {
              setTutorialPhase(-1);
              if (isLocalStorageAvailable())
                window.localStorage.setItem(tutorialStorageKey, String(true));
            }}>Finish ➜</h4>
          </>);
          break;
        default:
          break;
      }

      return phase;
    }

    return (
        <div id='all-wrapper'>
          { (tutorialPhase >= 0 && tutorialPhase <= 6) ?
            <div
              className={'modal'}>
              <div className={'tutorial-text'}>
                {renderPhase()}
              </div>
            </div> : null }
            <div id='canvas-wrapper'>
                <DrawControls
                    side={Side.Left}
                    currentCoordPath={currentCoordPath.current}
                    tutorialPhase={tutorialPhase}
                />
                <Timer
                    limit={limit}
                    lastSend={lastSend} />
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
                            debug('start pan');
                            return;
                        }

                        const bounds = canvas.getBoundingClientRect();

                        // Calculate the mouse position relative to the buffer
                        const scaledWidth  = canvas.width  * scale.current,
                              scaledHeight = canvas.height * scale.current;
                        const scaledOffset = getScaledOffset(canvasOffset, scale.current, canvas, buffer);

                        mousePos.current = { x: e.clientX - bounds.left,
                                             y: e.clientY - bounds.top };
                        isDrawing.current = true;
                        currentCoordPath.current.pos = [ { x: scale.current * mousePos.current.x + scaledOffset.x,
                                                           y: scale.current * mousePos.current.y + scaledOffset.y } ];
                        coordPathLen.current = 0;
                        debug('start draw: ' + mousePos.current.x + ', ' + mousePos.current.y);
                        setCanUndo(false);
                    }}
                    onMouseUp = {e => {
                        // Only proceed if the left mouse is pressed and isDrawing
                        if (e.button != 0 || !isDrawing) return;

                        if (cannotDraw) {
                            canvas.style.cursor = 'grab';
                            isPanning.current = false;
                            debug('finished pan');
                            return;
                        }

                        const bufferContext = buffer.getContext('2d');

                        mousePos.current = { x: 0, y: 0 };
                        isDrawing.current = false;

                        debug('finished draw');
                        if (currentCoordPath.current.pos.length == 0) return;

                        // Rerendering the whole stack is expensive, so do this only if explicitly directed.
                        if (!props.rerenderAll) {
                            debug('erasing stroke');
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
                        debug('sending stroke to server');
                        SocketUtils.sendStroke(data);
                        setCanUndo(true);
                        debug('draw curve');
                        drawCurveFromCoordPath(bufferContext, currentCoordPath.current,
                                               props.smoothness, props.thinning);

                        debug('updating stack');
                        setStack(prevStack => [...prevStack, data]);

                        // Reset the path
                        currentCoordPath.current.pos = []
                        debug('redrawing buffer');
                        drawFromBuffer(context, canvas, canvasOffset, buffer, scale.current);
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
                            panCanvas(canvas, buffer, canvasOffset, movement, scale.current);
                            drawFromBuffer(context, canvas, canvasOffset, buffer, scale.current);
                        } else {
                            // const canvas = canvasRef.current;
                            const bounds = canvas.getBoundingClientRect();
                            const bufferContext = buffer.getContext('2d');

                            if (isDrawing.current) {
                                const end: Coord = { x: e.clientX - bounds.left,
                                                     y: e.clientY - bounds.top };
                                context.strokeStyle = currentCoordPath.current.color;
                                drawLine(context, mousePos.current, end, currentCoordPath.current.width / scale.current);

                                const scaledWidth  = canvas.width  * scale.current,
                                      scaledHeight = canvas.height * scale.current;
                                const scaledOffset = getScaledOffset(canvasOffset, scale.current, canvas, buffer);
                                currentCoordPath.current.pos.push({ x: scale.current * end.x + scaledOffset.x, 
                                                                    y: scale.current * end.y + scaledOffset.y });
                                coordPathLen.current += distance(mousePos.current, end);

                                if (props.maxStrokeLen && coordPathLen.current >= props.maxStrokeLen) {
                                    canvas.dispatchEvent(new MouseEvent('mouseup', {
                                        bubbles: true, cancelable: true
                                    }));
                                }

                                mousePos.current = end;
                            }
                        }
                    }}
                    onMouseLeave = {e => {
                        if (isDrawing.current)
                            canvas.dispatchEvent(new MouseEvent('mouseup', {
                                bubbles: true, cancelable: true
                            }));
                    }}
                    onTouchStart = {e => {
                        e.preventDefault();

                        const bounds = canvas.getBoundingClientRect();
                        touchPos.current = { x: e.touches[0].clientX - bounds.left,
                                             y: e.touches[0].clientY - bounds.top };

                        if (e.touches.length > 1) {
                            const touchCoords: Coord[] = [
                                { x: e.touches[0].clientX, y: e.touches[0].clientY },
                                { x: e.touches[1].clientX, y: e.touches[1].clientY }
                            ];

                            console.log("fired");
                            touchDist.current = distance(touchCoords[0], touchCoords[1]);
                        }

                        if (cannotDraw) {
                            isPanning.current = true;
                            debug('start pan');
                            return;
                        }

                        const scaledWidth  = canvas.width  * scale.current,
                              scaledHeight = canvas.height * scale.current;
                        const scaledOffset = getScaledOffset(canvasOffset, scale.current, canvas, buffer);

                        isDrawing.current = true;
                        currentCoordPath.current.pos = [ { x: scale.current * touchPos.current.x + scaledOffset.x,
                                                           y: scale.current * touchPos.current.y + scaledOffset.y } ];
                        coordPathLen.current = 0;
                        debug('start draw: ' + touchPos.current.x + ', ' + touchPos.current.y);
                        setCanUndo(false);
                    }}
                    onTouchEnd = {e => {
                        e.preventDefault();
                        if (cannotDraw) {
                            isPanning.current = false;
                            debug('finished pan');
                            return;
                        }

                        if (e.touches.length > 0) return; // To prevent drawing after a zoom

                        const bufferContext = buffer.getContext('2d');

                        touchDist.current = 0;
                        touchPos.current = { x: 0, y: 0 }
                        isDrawing.current = false;

                        debug('finished draw');
                        if (currentCoordPath.current.pos.length == 0) return;

                        if (!props.rerenderAll) {
                            debug('erasing stroke');
                            undrawLineFromCoordPath(bufferContext, currentCoordPath.current);
                        }

                        const data: CoordPath = {
                            pos: currentCoordPath.current.pos,
                            width: currentCoordPath.current.width,
                            color: currentCoordPath.current.color
                        };
                        debug('sending stroke to server');
                        SocketUtils.sendStroke(data);
                        setCanUndo(true);
                        debug('draw curve');
                        drawCurveFromCoordPath(bufferContext, currentCoordPath.current,
                                               props.smoothness, props.thinning);

                        debug('updating stack');
                        setStack(prevStack => [...prevStack, data]);

                        // Reset the path
                        currentCoordPath.current.pos = []
                        debug('redrawing buffer');
                        drawFromBuffer(context, canvas, canvasOffset, buffer, scale.current);
                    }}
                    onTouchMove = {e => {
                        e.preventDefault();

                        const bounds = canvas.getBoundingClientRect();
                        const lastTouchPos: Coord = { x: e.touches[0].clientX - bounds.left,
                                                      y: e.touches[0].clientY - bounds.top };

                        if (e.touches.length == 2) { /* If zooming */
                            const touchCoords: Coord[] = [
                                { x: e.touches[0].clientX, y: e.touches[0].clientY },
                                { x: e.touches[1].clientX, y: e.touches[1].clientY }
                            ];

                            const lastTouchDist = distance(touchCoords[0], touchCoords[1]);
                            const touchDistDelta = lastTouchDist - touchDist.current;
                            const newScale = clamp(scale.current - touchDistDelta * 0.002, 1, maxScale.current);
                            scale.current = newScale;
                            drawFromBuffer(context, canvas, canvasOffset, buffer, newScale);
                            touchDist.current = lastTouchDist;
                        } else if (cannotDraw && isPanning.current) { /* If panning */
                            const deltaX = lastTouchPos.x - touchPos.current.x;
                            const deltaY = lastTouchPos.y - touchPos.current.y;

                            const movement = { x: deltaX, y: deltaY };

                            panCanvas(canvas, buffer, canvasOffset, movement, scale.current);
                            drawFromBuffer(context, canvas, canvasOffset, buffer, scale.current);
                        } else if (e.touches.length == 1) { /* If drawing */
                            const bufferContext = buffer.getContext('2d');

                            if (isDrawing.current) {
                                context.strokeStyle = currentCoordPath.current.color;
                                drawLine(context, touchPos.current, lastTouchPos, currentCoordPath.current.width / scale.current);

                                const scaledWidth  = canvas.width  * scale.current,
                                      scaledHeight = canvas.height * scale.current;
                                const scaledOffset = getScaledOffset(canvasOffset, scale.current, canvas, buffer);


                                currentCoordPath.current.pos.push({ x: scale.current * lastTouchPos.x + scaledOffset.x,
                                                                    y: scale.current * lastTouchPos.y + scaledOffset.y });
                                coordPathLen.current += distance(touchPos.current, lastTouchPos);

                                if (props.maxStrokeLen && coordPathLen.current >= props.maxStrokeLen) {
                                    debug('stroke too long; terminating');
                                    canvas.dispatchEvent(new TouchEvent('touchend'));
                                }
                            }
                        }

                        touchPos.current = lastTouchPos;
                    }}
                    onWheel={e => {
                        const newScale = clamp(scale.current + e.deltaY * 0.001, 1, maxScale.current);
                        scale.current = newScale;
                        drawFromBuffer(context, canvas, canvasOffset, buffer, newScale);
                    }}>
                    {'Your browser doesn\'t support <canvas> elements :('}
                </canvas>
              <div id={'draw-controls-div'}>
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
                    canUndo={canUndo}
                    canvasScale={scale.current}
                    paintProps={props}
                    toggleCannotDraw={toggleCannotDraw}
                    popStack={popStack}
                    tutorialPhase={tutorialPhase}
                />
              </div>
            </div>
            <br />
        </div>
    )
}

export default Paint;
