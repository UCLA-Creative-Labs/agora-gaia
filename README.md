# Project Gaia

Make sure you have `yarn` installed.
Run `yarn install` to install all dependencies.

## Instructions on usage
**To develop:** Run `yarn dev` to start a local development server at http://localhost:8080. Note that you will have to have a local PostgreSQL instance running for this website to function correctly. TODO

**To build:** Run `yarn build` to generate build versions of the website in the `dist/` folder, and run `yarn server` to start a server locally. Then open `dist/index.html` to open the website.

## To-Do

* Make sure routing works properly in prod.
* Load balancing time!

## Known bugs

* Paths are unantialiased. Not too big a deal, but it can be a little frustrating.
* Not a bug per se (or at least not one we'll fix), but if a user tries to open multiple windows to draw on one computer, they will be in for a confusing time.

## Server Base Architecture - Bryan

### Upon Client Load
```
Client side => socket connect to node.js server

            => get all updates from the db
``` 
```
Server side => socket receives connection

            => send over all data within psql server
```            
### Upon Client Draw
```
Client side => client socket notify server socket to update
```
```            
Server side => socket receives receives update

            => add update to psql server
            
            => broadcast an update to all other nodes in network
```
```            
Other nodes => receive update

            => draw update
```

### Upon Client Undo
```
Client side => client socket notify server socket to undo last line

            => use serial id to track all updates sent by client
```
```            
Server side => socket receives receives undo

            => DELETE row from psql server
            
            => broadcast deletion to all other nodes in network
```
```           
Other nodes => receive undo

            => undo 
```
## Server Advanced Architecture - Bryan

### Upon Client Load
```
Client side => load client side cache (cookie)

            => socket connect to node.js server
            
            => get all data after cached cookie
```
```
Server side => socket receives connection & id of last item

            => select data with info after client's last cookie
            
            => send data to client
```            
### Upon Client Draw
```
Client side => add a latency of 30 seconds to allow for undoing

            => must keep track of last line drawn by user (NOT OTHER NODES)
            
            => client socket notify server socket to update
```
```            
Server side => socket receives receives update

            => add update to psql server
            
            => broadcast an update to all other nodes in network
```
```            
Other nodes => receive update

            => draw update
```

### Upon Client Undo
```
Client side => client socket notify app server socket to undo last line drawn by current node

            => get a emit from server on whether undo was successful or not
           
            => if unsuccessful, then output that "undo was unsuccessful, changes have been pushed"
            
            => if successful, then output that "undo was successful, thankfully no one saw the embarrasing thing you drew"
```
            
```
Server side => socket receives receives undo

            => check if the line has been sent to postgres yet (past 30 second delay)
            
            => if so then send a notification to the client that undo was unsuccessful
            
            => if the line is within the 30 second latency, notify client that undo was succesful
 ```
     
            


