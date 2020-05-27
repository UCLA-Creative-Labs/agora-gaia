import React, { useState, useEffect}  from "react";
import Lottie from "react-lottie";

// assets/lottie contains all the json data for lottie
import * as doneData from "../assets/lottie/doneData.json"
import * as drawingLove from  "../assets/lottie/drawingLove.json"

import './styles/Loader.scss';

// TODO: Change animationData => connecting animation
const connectOptions = {
    loop: true,
    autoplay: true,
    animationData: drawingLove.default,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice"
    }
  };

// TODO: Change animationData => connecting animation
const buildOptions = {
    loop: true,
    autoplay: true,
    animationData: drawingLove.default,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice"
    }
  };

const doneOptions = {
    loop: false,
    autoplay: true,
    animationData: doneData.default,
    rendererSettings: {
        preserveAspectRatio: "xMidYMid slice"
    }
};

function Loader(){
    // Two states => one for connecting, one for building 
    const [ isConnecting, setIsConnecting ] = useState(true)
    const [ isBuilding, setIsBuilding ] = useState(true)

    // Setting size of animations
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    const ani_size = vh / 1242 * 120;

    // On component mount
    // TODO: hook up to Paint to allow for changing states and setting things false
    useEffect(() => {
        const body = document.body;
        setTimeout(() => {
            setIsConnecting(false);                     // After you have connected, set state to false 
            setTimeout(() => {                          // Set a timeout to let the checkmark stay for 1.5s
                body.classList.add('connected');        // This transitions between "connecting" and "building"
                setTimeout(()=>{
                    setIsBuilding(false);               // After canvas is built, set state to false
                    setTimeout(()=>{                    // Transitions to show the canvas and hide the animations
                        body.classList.add('loaded');
                    },1500);  
                }, 4000);
            },1500)
        }, 4000);
    }, []);

    // Style change so margin isnt huge
    const overrideMargins = {
        margin: "0px",
    }

    return(
        <div id='loader-wrapper'>
            <div id='init'>
                <div id='loader'>
                    <div id='connect-group'>
                        <h1 >connecting to server</h1>
                        {/* if connecting, make the lottie the connecting one, else make it the check mark*/}
                        {isConnecting ? (
                            <Lottie options={connectOptions} height={ani_size} width={ani_size} style={overrideMargins} />
                        ) : (
                            <Lottie options={doneOptions} height={ani_size} width={ani_size} style={overrideMargins}/>
                        )}
                    </div>
                    <div id='build-group'>
                        <h1 >building canvas</h1>
                        {/* if building, make the lottie the building one, else make it the check mark*/}
                        {isBuilding ? (
                            <Lottie options={buildOptions} height={ani_size} width={ani_size} style={overrideMargins} />
                        ) : (
                            <Lottie options={doneOptions} height={ani_size} width={ani_size} style={overrideMargins}/>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Loader;