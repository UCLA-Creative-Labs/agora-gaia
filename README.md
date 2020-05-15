# Collaborative Canvas

Make sure you have `yarn` installed.
Run `yarn install` to install all dependencies.

## Instructions on usage
**To develop:** Run `yarn start` to start a local development server at http://localhost:8080. Add `--host=0.0.0.0` if you want to test the webpage on your phone.

**To build:** Run `yarn build` to generate build versions of the website in the `dist/` folder, then open `dist/index.html` to open the website.

## To-Do

* Add zooming and/or panning.
* Note: Right now, I'm using `useRef` for everything related to the canvas (current path, path stack, etc.), because I figured using `useState` and `useEffect` would make the canvas re-render on every update, like drawing a new stroke, changing stroke width, etc., which seems inefficient especially if we want to make sure this scales well. But `useState` and `useEffect` are more idiomatic React and would allow us to update stuff on the DOM (like a `<p>` tag with tracking the stroke width), so will need to look into this more.

## Known bugs

* ~~Especially fast strokes leave a little tail behind after being "undrawn" and redrawn. Probably because the last couple of mouse movements aren't being stored. **EDIT**: this is exacerbated by increasing smoothing levels, as the degree to which the final line does not overlap the originally-drawn one increases with smoothness.~~
* Paths are unantialiased. Not too big a deal, but it can be a little frustrating.
* Doesn't support touchscreens yet.
* ~~Undrawing and redrawing is faster than redrawing the whole canvas every stroke, but it leaves little gaps in previous strokes. This is avoided if smoothing is 1.~~ (You can enable a flag to redraw the entire canvas every stroke, but this is much slower.)
* ~~If the mouse is pressed inside the canvas, dragged outside the canvas, and released, then the canvas doesn't register the mouseUp and so doesn't add that stroke to the stack or smooth it.~~
* ~~Limiting the stroke length produces residue for faster strokes.~~ (Also fixed by enabling the redraw flag mentioned previously.)
* ~~If the canvas is resized, the drawn data stays where it is instead of resizing relatively. Could be useful?~~ Not going to address this because the canvas' drawings shouldn't be resized with the canvas.

## Server Base Architecture - Bryan

### Upon Client Load
**Client side** => socket connect to node.js server

            => get all updates from the db
            
**Server side** => socket receives connection

            => send over all data within psql server
            
### Upon Client Draw
**Client side** => client socket notify server socket to update
            
**Server side** => socket receives receives update

            => add update to psql server
            
            => broadcast an update to all other nodes in network
            
**Other nodes** => receive update

            => draw update

### Upon Client Undo
**Client side** => client socket notify server socket to undo last line

            => use serial id to track all updates sent by client
            
**Server side** => socket receives receives undo

            => DELETE row from psql server
            
            => broadcast deletion to all other nodes in network
            
**Other nodes** => receive undo

            => undo 
            
## Server Advanced Architecture - Bryan

### Upon Client Load
**Client side** => load client side cache (cookie)

            => socket connect to node.js server
            
            => get all data after cached cookie
            
**Server side** => socket receives connection & id of last item

            => select data with info after client's last cookie
            
            => send data to client
            
### Upon Client Draw
**Client side** => add a latency of 30 seconds to allow for undoing

            => must keep track of last line drawn by user (NOT OTHER NODES)
            
            => client socket notify server socket to update
            
**Server side** => socket receives receives update

            => add update to psql server
            
            => broadcast an update to all other nodes in network
            
**Other nodes** => receive update

            => draw update

### Upon Client Undo
**Client side** => client socket notify app server socket to undo last line drawn by current node

            => get a emit from server on whether undo was successful or not
           
            => if unsuccessful, then output that "undo was unsuccessful, changes have been pushed"
            
            => if successful, then output that "undo was successful, thankfully no one saw the embarrasing thing you drew"
            
            
**Server side** => socket receives receives undo

            => check if the line has been sent to postgres yet (past 30 second delay)
            
            => if so then send a notification to the client that undo was unsuccessful
            
            => if the line is within the 30 second latency, notify client that undo was succesful
 
            
            


