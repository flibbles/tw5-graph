/*\

Tests node widgets.

\*/

describe('NodeWidget', function() {

function fetchGraphObjects(widget) {
	var objects = {};
	var searchChildren = function(children) {
		for (var i = 0; i < children.length; i++) {
			var widget = children[i];
			var id = widget.id;
			if (widget.getNodeData && widget.changed) {
				objects.nodes = objects.nodes || Object.create(null);
				objects.nodes[id] = widget.getNodeData();
			}
			if (widget.getEdgeData && widget.changed) {
				objects.edges = objects.edges || Object.create(null);
				objects.edges[id] = widget.getEdgeData();
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
	widget = $tw.test.renderText(wiki, "<$node tiddler=N pos=Store!!pos />\n");
	expect(fetchGraphObjects(widget)).toEqual({nodes: {N: {}}});
	// Now we try it again, but the reference actually exists now
	wiki.addTiddler({title: "Store", pos: "13 17"});
	widget = $tw.test.renderText(wiki, "<$node tiddler=N pos=Store!!pos />\n");
	expect(fetchGraphObjects(widget)).toEqual({nodes: {N: {x: 13, y: 17}}});
});

});
