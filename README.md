# Graph for Tiddlywiki

Tiddlywiki is a great non-linear notebook.   
The internet has countless amazing visualization libraries for creating graphs.

TW5-Graph brings them together.

It is a framework plugin for creating graphs in Tiddlywiki. It has a quick and simple interface to make graphs quickly, but is also highly customizable so you can create the exact style of graphs you need.

For a demonstration and documentation, see the [demo site](https://flibbles.github.io/tw5-graph/).

## How to install

TW5-Graph requires you to install it **and** at least one other plugin wrapping a visualization engine. Currently, only one is supported.

[Vis-network](https://github.com/flibbles/tw5-vis-network)

If you're using a single-file tiddlywiki, all you have to do is visit the [demo site](https://flibbles.github.io/tw5-graph/), where both TW5-Graph and all its supported engines are available for a quick drag-and-drop install.

### For Node.js

The following is an abridged version of the [instructions found here](https://tiddlywiki.com/#Installing%20custom%20plugins%20on%20Node.js).

First, check out the source code using git. Then add its`plugins` directory to your TIDDLYWIKI_PLUGIN_PATH environment variable.

For instance, if you check out the project to a "~/Documents/Graph" directory. Then run `echo "TIDDLYWIKI_PLUGIN_PATH=${TIDDLYWIKI_PLUGIN_PATH}:~/Documents/Graph/plugins" >> .profile`

**You will need to repeat this process for the visualization libraries you plan to pair TW5-Graph with.**

Afterward, add the plugin inside your projects' `tiddlywiki.info` file.
The plugins section will look something like:
```
{
   ...
   "plugins": [
      ...
      "flibbles/graph",
      "flibbles/(vis-network or some other visualization plugin)"
   ],
   ...
}
```

Alternatively, you can also copy the `plugins` directly into your projects'
root directory. Though this makes the install local only to those specific
projects.

## How to test

Make sure you have `tiddlywiki` available on your PATH. Then from the project root directory, type:

`tiddlywiki --build test`
