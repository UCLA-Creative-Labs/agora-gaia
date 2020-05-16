import React, { useState, useEffect, useRef } from 'react';

import {
    Side,
    CanvasProps, DrawControlProps,
    undo
} from '../utils/PaintUtils';

import './styles/Paint.scss';

import UndoImg from '../assets/icons/undo-black-18dp.svg';
import ZoomInImg from '../assets/icons/add-black-18dp.svg';
import ZoomOutImg from '../assets/icons/remove-black-18dp.svg';
import BrushImg from '../assets/icons/brush-black-18dp.svg';
import PanImg from '../assets/icons/pan_tool-black-18dp.svg';

function DrawControls(props: CanvasProps & DrawControlProps) {
    const [ width, setWidth ] = useState(props.currentCoordPath.width);
    const [ drawToggleBtn, setDrawToggleBtn ] = useState(PanImg);

    useEffect(() => {
        if (props.cannotDraw) setDrawToggleBtn(PanImg);
        else setDrawToggleBtn(BrushImg);
    }, [props.cannotDraw]);

    switch (props.side) {
        case Side.Left:
            return (
                <span id='draw-controls'>
                    <button
                        onClick = {_ => {
                            if (props.currentCoordPath.width <= 12) {
                                props.currentCoordPath.width += 1;
                                setWidth(prev => prev + 1);
                            }
                        }}
                        className='side-btn'
                        id='zoomin-btn'>
                        <img src={ZoomInImg} style={{'width':'30px', 'height':'30px'}}/>
                    </button>
                    <p>{width}</p>
                    <button
                        onClick = {_ => {
                            if (props.currentCoordPath.width > 1) {
                                props.currentCoordPath.width -= 1;
                                setWidth(prev => prev - 1);
                            }
                        }}
                        className='side-btn'
                        id='zoomout-btn'>
                        <img src={ZoomOutImg} style={{'width':'30px', 'height':'30px'}}/>
                </button>
                </span>
            );
            break;
        case Side.Right:
            return (
                <span id='draw-controls'>
                    <button
                        onClick = {_ => {
                            undo(props.context, props.canvas,
                                 props.bufferContext, props.buffer,
                                 props.canvasOffset,
                                 props.coordPathStack,
                                 props.popStack,
                                 props.paintProps.rerenderAll, props.paintProps.smoothness);
                            props.context.strokeStyle = props.currentCoordPath.color;
                            props.context.lineWidth = props.currentCoordPath.width;
                        }}
                        className='side-btn'
                        id='undo-btn'>
                        <img src={UndoImg} style={{'width':'30px', 'height':'30px'}}/>
                    </button>
                    <button
                        onClick = {_ => {
                            if (!props.canToggle) return;

                            props.toggleCannotDraw();
                        }}
                        className='side-btn'
                        id='brush-btn'>
                        <img src={drawToggleBtn} style={{'width':'30px', 'height':'30px'}}/>
                    </button>
                </span>
            );
            break;
    }
}

export default DrawControls;
