import React, { useState, useEffect, useRef } from 'react';
import { SketchPicker } from 'react-color';

import {
  Side,
  CanvasProps, DrawControlProps,
  undo, drawFromBuffer
} from '../utils/PaintUtils';
import { debug } from '../utils/Utils';
import * as SocketUtils from '../utils/SocketUtils';

import './styles/Paint.scss';

import UndoImg from '../assets/icons/undo-black-18dp.svg';
import ZoomInImg from '../assets/icons/add-black-18dp.svg';
import ZoomOutImg from '../assets/icons/remove-black-18dp.svg';
import BrushImg from '../assets/icons/brush-black-18dp.svg';
import PanImg from '../assets/icons/pan_tool-black-18dp.svg';

// Component to hold draw control buttons. On the left are buttons to control
// the width of the user's stroke; on the right are buttons to undo or to toggle
// between drawing and panning.
function DrawControls(props: CanvasProps & DrawControlProps) {
  const [width, setWidth] = useState(props.currentCoordPath.width);
  const [drawToggleBtn, setDrawToggleBtn] = useState(PanImg);
  const [cannotToggle, setCannotToggle] = useState(false);
  const [undoDisabled, setUndoDisabled] = useState(true);
  const [selectedColor, setSelectedColor] = useState({ background: 'black' });
  const [displayColorPicker, setDisplayColorPicker] = useState(false);

  // Set the image in the toggle button according to whether or not the user can
  // draw.
  useEffect(() => {
    if (props.cannotDraw) setDrawToggleBtn(PanImg);
    else setDrawToggleBtn(BrushImg);
  }, [props.cannotDraw]);

    useEffect(() => {
        setCannotToggle(!props.canToggle);
    }, [props.canToggle]);

    // Register a handler to receive an undo event. If the event allows for
    // an undo, go ahead and do it. Otherwise, disable the undo button.
    useEffect(() => {
        const undoHandler = (isErased: boolean) => {
             if (isErased) {
                   undo(props.bufferContext, props.buffer,
                         props.coordPathStack,
                         props.popStack,
                         props.paintProps.rerenderAll,
                         props.paintProps.smoothness);
                   props.context.strokeStyle = props.currentCoordPath.color;
                   props.context.lineWidth = props.currentCoordPath.width;
                   props.popStack();
                   drawFromBuffer(props.context, props.canvas,
                                  props.canvasOffset, props.buffer, props.canvasScale);
             } else {
                 setUndoDisabled(true);
             }
        };

        // clutters log
        // debug('registering undo handler');
       SocketUtils.registerUndo(undoHandler);

        return () => {
            // debug('unregistering undo handler');
            // SocketUtils.unregisterUndo(undoHandler);
            SocketUtils.unregisterAllUndo();
        };
    }, [props]);

    // Disable undo if the corresponding property is modified
    useEffect(() => {
        debug('undo disabled = ' + (!props.canUndo));
        setUndoDisabled(!props.canUndo);
    }, [props.canUndo]);

    // Register a handler which disables the undo button if such an
    // event is received from the server.
    useEffect(() => {
        const disableUndoHandler = (disableUndo: boolean) => {
            setUndoDisabled(disableUndo);
        };

        debug('registering disableundo handler');
        SocketUtils.registerDisableUndo(disableUndoHandler);

        return () => {
            debug('unregistering disableundo handler');
            SocketUtils.unregisterDisableUndo(disableUndoHandler);
        }
    }, []);

    // Display a particular set of buttons based on the side this component is on.
  let buttons;
  switch (props.side) {
    case Side.Left:
      buttons = (
        <span id='draw-controls'>
          <button
            onClick={_ => {
              if (props.currentCoordPath.width < 15) {
                props.currentCoordPath.width += 1;
                setWidth(prev => prev + 1);
              }
            }}
            className='side-btn'
            id='zoomin-btn'>
            <img src={ZoomInImg} style={{ 'width': '30px', 'height': '30px' }} />
          </button>
          <p id='width-disp'>{width}</p>
          <button
            onClick={_ => {
              if (props.currentCoordPath.width > 1) {
                props.currentCoordPath.width -= 1;
                setWidth(prev => prev - 1);
              }
            }}
            className='side-btn'
            id='zoomout-btn'>
            <img src={ZoomOutImg} style={{ 'width': '30px', 'height': '30px' }} />
          </button>
        </span>
      );
      break;
    case Side.Right:
    default:
      buttons = (
        <span id='draw-controls'>
          <button
            onClick={_ => {
                if (!undoDisabled) {
                    SocketUtils.sendUndo(true);
                    setUndoDisabled(true);
                }
            }}
            className={'side-btn' + (undoDisabled ? ' disabled' : '')}
            id='undo-btn'>
            <img src={UndoImg} style={{ 'width': '30px', 'height': '30px' }} />
          </button>
          <button
            onClick={_ => {
              if (cannotToggle) return;

              props.toggleCannotDraw();
            }}
              className={'side-btn' + (cannotToggle ? ' disabled' : '')}
            id='brush-btn'>
            <img src={drawToggleBtn} style={{ 'width': '30px', 'height': '30px' }} />
          </button>
          <button
            onClick={_ => { setDisplayColorPicker(old => !old) }}
            className='side-btn'
            style = {{...selectedColor, zIndex: 99}} />
        </span>
      );
      break;
  }

  return (
    <>
      <div
        className={'modal'}
        style={{
          display: displayColorPicker ? 'block' : 'none'
        }}
      >
        <SketchPicker
          color={selectedColor.background}
          width={500}
          onChange={(color, _) => setSelectedColor({ background: color.hex })}
          onChangeComplete={(color, _) => {
            props.context.strokeStyle = color.hex;
            props.currentCoordPath.color = color.hex;
          }}
        />
      </div>
      {buttons}
    </>
  );
}

export default DrawControls;
