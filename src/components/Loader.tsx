import React, { useState, useEffect}  from "react";
// import FadeIn from "react-fade-in";
import Lottie from "react-lottie";

import * as doneData from "../assets/lottie/doneData.json"
import * as drawingLove from  "../assets/lottie/drawingLove.json"

import './styles/Loader.scss';


const connectOptions = {
    loop: true,
    autoplay: true,
    animationData: drawingLove.default,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice"
    }
  };

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
    const [ isConnecting, setIsConnecting ] = useState(true)
    const [ isBuilding, setIsBuilding ] = useState(true)
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    const ani_size = vh / 1242 * 120;
    console.log(vh)
    console.log(ani_size)

    // On component mount
    useEffect(() => {
        const body = document.body;
        setTimeout(() => {
            setIsConnecting(false);
            setTimeout(() => {
                body.classList.add('connected');
                setTimeout(()=>{
                    setIsBuilding(false);
                    setTimeout(()=>{
                        body.classList.add('loaded');
                    },1500);  
                }, 4000);
            },1500)
        }, 4000);
    }, []);

    const overrideMargins = {
        margin: "0px",
    }

    return(
        <div id='loader-wrapper'>
            <div id='init'>
                <div id='loader'>
                    <div id='connect-group'>
                        <h1 >connecting to server</h1>
                        {isConnecting ? (
                            <Lottie options={connectOptions} height={ani_size} width={ani_size} style={overrideMargins} />
                        ) : (
                            <Lottie options={doneOptions} height={ani_size} width={ani_size} style={overrideMargins}/>
                        )}
                    </div>
                    <div id='build-group'>
                        <h1 >building canvas</h1>
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