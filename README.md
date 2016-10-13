A personal logging platform.  See the
[motivation](http://pcmonk.me/2016/10/13/personal-logging.html) and
[strategy](http://pcmonk.me/2016/10/13/logging-idea-maze.html) posts for more
about the program at a high level.

To run:

    npm install
    ./run

Depends on git (unless you manually get the node-bunyan source and put it in
the "node-bunyan" directory), node, and npm.

By default, this listens on port 3000.  If you need to change that,
look at the "listen()" line of index.js.

Bugs or feature suggestions should go in the Github [issue
tracker](https://github.com/philipcmonk/plogging/issues).
