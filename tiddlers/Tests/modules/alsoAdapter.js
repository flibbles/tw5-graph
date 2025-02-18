/*\
module-type: graphengineadapter

Mock adapter to test switching adapters.

\*/

"use strict";

function AlsoAdapter(wiki) {};
AlsoAdapter.prototype.initialize = function() {};
AlsoAdapter.prototype.update = function() {};
AlsoAdapter.prototype.render = function() {};

exports.Also = AlsoAdapter;
