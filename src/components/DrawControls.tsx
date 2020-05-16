import React, { useState, useEffect } from 'react';

import {
    Side,
    CanvasProps, DrawControlProps,
    undo
} from '../utils/PaintUtils';

import './styles/Paint.scss';

import UndoImg from '../assets/icons/undo-black-18dp.svg';
import ZoomInImg from '../assets/icons/add-black-18dp.svg';
import ZoomOutImg from '../assets/icons/remove-black-18dp.svg';

function DrawControls(props: CanvasProps & DrawControlProps) {
    const [ width, setWidth ] = useState(props.currentCoordPath.width);

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
                            undo(props.canvas, props.coordPathStack,
                                 props.paintProps.rerenderAll, props.paintProps.smoothness);
                            props.context.strokeStyle = props.currentCoordPath.color;
                            props.context.lineWidth = props.currentCoordPath.width;
                        }}
                        className='side-btn'
                        id='undo-btn'>
                        <img src={UndoImg} style={{'width':'30px', 'height':'30px'}}/>
                    </button>
                </span>
            );
            break;
    }
}

export default DrawControls;
