import React, { useState, useEffect, useRef } from 'react';

import {
  Side,
  CanvasProps, DrawControlProps,
  undo
} from '../utils/PaintUtils';
import { debug } from '../utils/Utils';
import * as SocketUtils from '../utils/SocketUtils';

import './styles/Paint.scss';

import UndoImg from '../assets/icons/undo-black-18dp.svg';
import ZoomInImg from '../assets/icons/add-black-18dp.svg';
import ZoomOutImg from '../assets/icons/remove-black-18dp.svg';
import BrushImg from '../assets/icons/brush-black-18dp.svg';
import PanImg from '../assets/icons/pan_tool-black-18dp.svg';

function DrawControls(props: CanvasProps & DrawControlProps) {
  const [width, setWidth] = useState(props.currentCoordPath.width);
  const [drawToggleBtn, setDrawToggleBtn] = useState(PanImg);
  const [cannotToggle, setCannotToggle] = useState(false);
  const [undoDisabled, setUndoDisabled] = useState(true);

  useEffect(() => {
    if (props.cannotDraw) setDrawToggleBtn(PanImg);
    else setDrawToggleBtn(BrushImg);
  }, [props.cannotDraw]);

    useEffect(() => {
        console.log(props.canToggle);
        setCannotToggle(!props.canToggle);
    }, [props.canToggle]);

    useEffect(() => {
        const undoHandler = (isErased: boolean) => {
             if (isErased) {
                   undo(props.context, props.canvas,
                         props.bufferContext, props.buffer,
                         props.canvasOffset,
                         props.coordPathStack,
                         props.popStack,
                         props.paintProps.rerenderAll, props.paintProps.smoothness);
                   props.context.strokeStyle = props.currentCoordPath.color;
                   props.context.lineWidth = props.currentCoordPath.width;
             } else {
                 setUndoDisabled(true);
               console.log("Failed to Erase");
             }
        };

        debug('registering undo handler');
       SocketUtils.handleUndo(undoHandler);

        return () => {
            debug('unregistering undo handler');
            // SocketUtils.unregisterUndo(undoHandler);
            SocketUtils.unregisterAllUndo();
        };
    }, [props]);

    useEffect(() => {
        debug('undo disabled = ' + (!props.canUndo));
        setUndoDisabled(!props.canUndo);
    }, [props.canUndo]);

    useEffect(() => {
        const disableUndoHandler = (disableUndo: boolean) => {
            setUndoDisabled(disableUndo);
        };

        debug('registering disableundo handler');
        SocketUtils.handleDisableUndo(disableUndoHandler);

        return () => {
            debug('unregistering disableundo handler');
            SocketUtils.unregisterDisableUndo(disableUndoHandler);
        }
    }, []);

  switch (props.side) {
    case Side.Left:
      return (
        <span id='draw-controls'>
          <button
            onClick={_ => {
              if (props.currentCoordPath.width <= 12) {
                props.currentCoordPath.width += 1;
                setWidth(prev => prev + 1);
              }
            }}
            className='side-btn'
            id='zoomin-btn'>
            <img src={ZoomInImg} style={{ 'width': '30px', 'height': '30px' }} />
          </button>
          <p>{width}</p>
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
      return (
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
        </span>
      );
      break;
  }
}

export default DrawControls;
