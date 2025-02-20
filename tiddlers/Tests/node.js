/*\

Tests node widgets.

\*/

describe('NodeWidget', function() {

function fetchGraphObjects(widget) {
	var objects = {};
	var searchChildren = function(children) {
		for (var i = 0; i < children.length; i++) {
			var widget = children[i];
			var type = widget.graphObjectType;
			if (type && widget.changed) {
				objects[type] = objects[type] || Object.create(null);
				widget.setStyle({});
				objects[type][widget.id] = widget.getGraphObject();
			}
			if (widget.children) {
				searchChildren(widget.children);
			}
		}
	};
	searchChildren([widget]);
	return objects;
};

it("gets coordinates from pos attribute", function() {
	var wiki = new $tw.Wiki();
	var widget;
	widget = $tw.test.renderText(wiki, "<$node $tiddler=N pos={{Store!!pos}} />\n");
	expect(fetchGraphObjects(widget)).toEqual({nodes: {N: {}}});
	// Now we try it again, but the reference actually exists now
	wiki.addTiddler({title: "Store", pos: "13,17"});
	widget = $tw.test.renderText(wiki, "<$node $tiddler=N pos={{Store!!pos}} />\n");
	expect(fetchGraphObjects(widget)).toEqual({nodes: {N: {x: 13, y: 17}}});
});

});
