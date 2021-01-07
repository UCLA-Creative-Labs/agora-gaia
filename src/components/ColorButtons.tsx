import React, { useState } from 'react';
import { SketchPicker } from 'react-color';

import { CanvasProps } from '../utils/PaintUtils';

import './styles/Paint.scss'

// Component for the various color selection buttons available to the user.
// Color defaults to black if one is not explicitl chosen.
function ColorButtons(props: CanvasProps) {
    const [ selectedColor, setSelectedColor ] = useState({ background: 'black' });

    return(
        <SketchPicker
          color={selectedColor}
          onChange={setSelectedColor}
          onChangeComplete={(color, _) => {
            props.context.strokeStyle = color.hex;
            props.currentCoordPath.color = color.hex;
          }}
        />
    );
}

export default ColorButtons;
