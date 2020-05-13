# Collaborative Canvas

Make sure you have `yarn` installed.
Run `yarn install` to install all dependencies.

## Instructions on usage
**To develop:** Run `yarn start` to start a local development server at http://localhost:8080. Add `--host=0.0.0.0` if you want to test the webpage on your phone.

**To build:** Run `yarn build` to generate build versions of the website in the `dist/` folder, then open `dist/index.html` to open the website.

## Known bugs

* ~~Especially fast strokes leave a little tail behind after being "undrawn" and redrawn. Probably because the last couple of mouse movements aren't being stored. **EDIT**: this is exacerbated by increasing smoothing levels, as the degree to which the final line does not overlap the originally-drawn one increases with smoothness.~~
* Undrawing and redrawing produces an un-antialiased drawing. Not too big a deal, but it can be a little frustrating.
* Doesn't support touchscreens yet.
* Undrawing and redrawing is faster than redrawing the whole canvas every stroke, but it leaves little gaps in previous strokes. This is avoided if smoothing is 1.
* ~~If the mouse is pressed inside the canvas, dragged outside the canvas, and released, then the canvas doesn't register the mouseUp and so doesn't add that stroke to the stack or smooth it.~~
* Limiting the stroke length produces residue for faster strokes.
