import React, { useRef } from 'react';

function drawTest(canvas: HTMLCanvasElement) {
    if (!canvas.getContext) return;

    const context: CanvasRenderingContext2D = canvas.getContext('2d');

    const center = {
        x: canvas.width / 2,
        y: canvas.height / 2
    };

    context.fillStyle = 'rgb(200, 0, 0)';
    context.fillRect(center.x - 10, center.y - 10, 50, 50);

    context.fillStyle = 'rgba(0, 0, 200, 0.5)';
    context.fillRect(center.x + 10, center.y + 10, 50, 50);
}

function drawLine(context: CanvasRenderingContext2D,
                  start: number[], end: number[]) {
    context.beginPath();
    context.strokeStyle = 'black';
    context.lineWidth = 10;
    context.moveTo(start[0], start[1]);
    context.lineTo(end[0], end[1]);
    context.stroke();
    context.closePath();
}

function Paint() {
    const canvasRef = useRef(null);
    const isDrawing = useRef(false);

    const mousePos = useRef([0, 0]);

    return (
        <canvas
            width={500}
            height={500}
            ref={canvasRef}
            style={{border: '1px solid black'}}
            onMouseDown = {e => {
                const canvas = canvasRef.current;
                const bounds = canvas.getBoundingClientRect();

                mousePos.current = [ e.clientX - bounds.left, 
                                     e.clientY - bounds.top ];
                isDrawing.current = true;
            }}
            onMouseUp = {e => {
                mousePos.current = [ 0, 0 ];
                isDrawing.current = false;
            }}
            onMouseMove = {e => {
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');
                const bounds = canvas.getBoundingClientRect();

                if (isDrawing.current) {
                    const end = [ e.clientX - bounds.left, 
                                  e.clientY - bounds.top ];
                    drawLine(context, mousePos.current, end);
                    mousePos.current = end;
                }
            }}
            >
        </canvas>
    )
}

export default Paint;
