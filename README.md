# Collaborative Canvas

Make sure you have `yarn` installed.
Run `yarn install` to install all dependencies.

## Instructions on usage
**To develop:** Run `yarn start` to start a local development server at http://localhost:8080.

**To build:** Run `yarn build` to generate build versions of the website in the `dist/` folder, then open `dist/index.html` to open the website.

## Known bugs

* ~~Especially fast strokes leave a little tail behind after being "undrawn" and redrawn. Probably because the last couple of mouse movements aren't being stored. **EDIT**: this is exacerbated by increasing smoothing levels, as the degree to which the final line does not overlap the originally-drawn one increases with smoothness.~~
* Undrawing and redrawing produces an un-antialiased drawing. Not too big a deal, but it can be a little frustrating.
* Doesn't support touchscreens yet.
