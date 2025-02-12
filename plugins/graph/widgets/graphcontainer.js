/*\
title: $:/plugins/flibbles/graph/widgets/graphcontainer.js
type: application/javascript
module-type: library

Widget for creating graphs.

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var ContainerWidget = function() {};

ContainerWidget.prototype = new Widget();

exports.graphcontainer = ContainerWidget;

