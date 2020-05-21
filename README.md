# Agora - Gaia

Named for the Earth deity of Greek mythology, **Gaia** is the frontend of Agora. Gaia works in tandem with [Ouranos, the backend](https://github.com/UCLA-Creative-Labs/agora-ouranos).

For more information about how Gaia works, visit our [Wiki](https://github.com/UCLA-Creative-Labs/agora-gaia/wiki).

## Development

Make sure you have the latest version of `yarn` installed.
As always, clone this repository and `cd` into it. Run `yarn install` to install all needed dependencies.

Before running anything, you'll need to create a file named `.env` in the repository's root.
Inside it, add the following line:
```env
REACT_APP_SOCKET_SERVER=<your local server instance>
```
Replace `<your local server instance>` with the URL of your local server instance (see [Agora Ouranos](https://github.com/UCLA-Creative-Labs/agora-ouranos)), e.g. `http://localhost:3000`.

With that in place, starting a local development instance of the frontend is as simple as running `yarn start`.
(Note that if you want to be able to connect to this instance from other machines on your local network using your machine's local IP address (`192.168._._`), you'll have to add an additional `--host=0.0.0.0`.)

To generate a production build, simply run `yarn build`.
The resulting files can be found in the `dist/` directory.
Simply open `dist/index.html` to run the site.

## To-Do

* Add moderation capabilities.
* Try to support drawing on touch screens.

## Known bugs

* Paths are unantialiased. Not too big a deal, but it can be a little frustrating.
* Not a bug per se (or at least not one we'll fix), but if a user tries to open multiple windows to draw on one computer, they will be in for a confusing time.
