import React, { useState } from 'react';

import { CanvasProps } from '../utils/PaintUtils';

import './styles/Paint.scss'

function ColorButtons(props: CanvasProps) {
    const [ selectedColor, setSelectedColor ] = useState('black');

    return(
        <div id='color-btns'>
            {props.colors.map(color => {
                return (
                    <button
                        key = {color+'-btn'}
                        onClick = {_ => {
                            props.context.strokeStyle = color;
                            props.currentCoordPath.color = color;
                            setSelectedColor(color);
                        }}
                        className = {'color-btn' + (selectedColor == color ? ' selected' : '')}
                        style = {{
                            'background': color
                        }}/>
                );
            })}
        </div>
    );
}

export default ColorButtons;
