import React from 'react';

import { CanvasProps } from '../utils/PaintUtils';

import './styles/Paint.scss'

function ColorButtons(props: CanvasProps) {
    return(
        <div id='color-btns'>
            {props.colors.map(color => {
                return (
                    <button
                        key = {color+'-btn'}
                        onClick = {_ => {
                            props.context.strokeStyle = color;
                            props.currentCoordPath.color = color;
                        }}
                        className = 'color-btn'
                        style = {{ 'background': color }}/>
                );
            })}
        </div>
    );
}

export default ColorButtons;
