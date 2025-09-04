/*\

Tests that graphs properly refresh.

\*/

describe('GraphWidget', function() {

var wiki, init, update, destroy, register, window;

beforeEach(function() {
	wiki = new $tw.Wiki();
	({update, init, destroy, register, window} = $tw.test.setSpies());
});


function onlyCallOf(spy) {
	expect(spy).toHaveBeenCalledTimes(1);
	return spy.calls.first().args;
};

it('handles updates to nodes', async function() {
	wiki.addTiddlers([
		{title: "A", tags: "node"},
		{title: "B", tags: "node"},
		{title: "C", tags: "node"},
		{title: "D", tags: "node"}]);
	await $tw.test.flushChanges();
	var widgetNode = $tw.test.renderText(wiki, "<$graph><$list filter='[tag[node]]'><$node label={{!!caption}} />");
	expect($tw.test.latestEngine.objects.nodes).toEqual({ A: {}, B: {}, C: {}, D: {}});
	// Now we add and remove a node to the graph
	wiki.addTiddlers([
		{title: "B2", tags: "node"},
		{title: "B"},
		{title: "C", tags: "node", caption: "Ccaption"}]);
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalledTimes(1);
	expect(update).toHaveBeenCalledWith({nodes: {B: null, B2: {}, C: {label: "Ccaption"}}});
});

it('does not send update if no graph objects changed', async function() {
	wiki.addTiddlers([{title: "A"},{title: "Other"}]);
	var widgetNode = $tw.test.renderText(wiki, "<$graph>{{Other}}");
	wiki.addTiddler({title: "Other", text: "New content"});
	await $tw.test.flushChanges();
	expect(update).not.toHaveBeenCalled();
});

/*** garbage handling ***/

it("detects when to destroy itself", async function() {
	register.and.callThrough();
	wiki.addTiddler({title: "View", text: "yes"});
	wiki.addTiddler({title: "Engine", text: "Test"});
	var widgetNode = $tw.test.renderText(wiki, "<%if [{View}!match[no]] %><$graph $engine={{Engine}} />");
	widgetNode.document.body = {
		contains: function(node) {
			while (node) {
				if (node === widgetNode.parentDomNode) {
					return true;
				}
				// Now check and make sure the parent has this as a child.
				if (!node.parentNode
				|| node.parentNode.childNodes.indexOf(node) < 0) {
					return false;
				}
				node = node.parentNode;
			}
		}
	};
	await $tw.test.flushChanges();
	$tw.test.utils.upkeep();
	expect(register).toHaveBeenCalled();
	register.calls.reset();
	expect(destroy).not.toHaveBeenCalled();
	// Now we put in a change that will
	wiki.addTiddler({title: "View", text: "no"});
	await $tw.test.flushChanges();
	$tw.test.utils.upkeep();
	expect(destroy).toHaveBeenCalled();
});

/*** color palette ***/

it('sends style update if palette changes', async function() {
	wiki.addTiddler({title: "graph-node-color", text: "#ff0000"});
	var widgetNode = $tw.test.renderText(wiki, '\\define colour(name) <$transclude $tiddler="$name$"/>\n<$graph/>')
	await $tw.test.flushChanges();
	var initialObjects = onlyCallOf(init)[1];
	expect(initialObjects).toEqual({graph: {nodeColor: "#ff0000"}});
	// Now we make a change
	wiki.addTiddler({title: "graph-node-color", text: "#0000ff"});
	await $tw.test.flushChanges();
	var newObjects = onlyCallOf(update)[0];
	expect(newObjects).toEqual({graph: {nodeColor: "#0000ff"}});
});

it('sends style and node updates together', async function() {
	wiki.addTiddler({title: "graph-node-color", text: "#ff0000"});
	var widgetNode = $tw.test.renderText(wiki, '\\define colour(name) <$transclude $tiddler="$name$">#000000</$transclude>\n<$graph><$node $tiddler=N label={{graph-node-color}} />')
	await $tw.test.flushChanges();
	var initialObjects = onlyCallOf(init)[1];
	expect(Object.keys(initialObjects)).toEqual(["nodes", "graph"]);
	expect(initialObjects.graph.nodeColor).toBe("#ff0000");
	// Now we make a change
	wiki.addTiddler({title: "graph-node-color", text: "#0000ff"});
	await $tw.test.flushChanges();
	var newObjects = onlyCallOf(update)[0];
	// We test this way instead of toEqualing the whole thing because more
	// colors may be added later.
	expect(Object.keys(newObjects)).toEqual(["nodes", "graph"]);
	expect(newObjects.graph.nodeColor).toBe("#0000ff");
	expect(newObjects.nodes.N).toEqual({label: "#0000ff"});
});

it('can update colors and other graph settings together', async function() {
	wiki.addTiddler({title: "graph-node-color", text: "#ff0000"});
	var widgetNode = $tw.test.renderText(wiki, '\\define colour(name) <$transclude $tiddler="$name$"/>\n<$graph value={{graph-node-color}} />')
	await $tw.test.flushChanges();
	// Now we make a change
	wiki.addTiddler({title: "graph-node-color", text: "#0000ff"});
	await $tw.test.flushChanges();
	var newObjects = onlyCallOf(update)[0];
	// colors may be added later.
	expect(newObjects).toEqual({graph: {nodeColor: "#0000ff", value: "#0000ff"}});
});

it("conveys graph, node, and font colors to the engines", async function() {
	// All three of these are used, at least by vis-network
	wiki.addTiddler({title: "graph-node-color", text: "#ff0000"});
	wiki.addTiddler({title: "graph-font-color", text: "#00ff00"});
	wiki.addTiddler({title: "graph-background", text: "#0000ff"});
	var widgetNode = $tw.test.renderText(wiki, '\\define colour(name) <$transclude $tiddler="$name$"/>\n<$graph />')
	await $tw.test.flushChanges();
	var objects = onlyCallOf(init)[1];
	expect(objects).toEqual({graph: {nodeColor: "#ff0000", fontColor: "#00ff00", graphColor: "#0000ff"}});
});

/*** $engine attribute ***/

it("uses first available engine if none specified", function() {
	var First = function() {};
	First.prototype.init = function(){};
	First.prototype.render = function(){};
	spyOn($tw.test.utils, "getEngineMap").and.returnValue({anything: First});
	var alsoInit = spyOn(First.prototype, "init");
	var text = wiki.renderText("text/html", "text/vnd.tiddlywiki", "<$graph>=<<graphengine>>=")
	expect(alsoInit).toHaveBeenCalled();
	expect(text).toContain("=anything=");
});

it("does not let blank $engine value override settings", function() {
	wiki.addTiddler({title: "$:/config/flibbles/graph/engine", text: "Test"});
	var text = wiki.renderText("text/html", "text/vnd.tiddlywiki", "<$graph $engine={{missing}}>=<<graphengine>>=")
	expect(init).toHaveBeenCalled();
	expect(text).toContain("=Test=");
});

it("handles missing engine gracefully", function() {
	var text = wiki.renderText("text/html", "text/vnd.tiddlywiki", "<$graph $engine=Missing/>\n");
	expect(text).toContain("><span>'Missing' graphing library not found.</span></div>");
});

it("handles no engines installed gracefully", function() {
	spyOn($tw.test.utils, "getEngineMap").and.returnValue({});
	var text = wiki.renderText("text/html", "text/vnd.tiddlywiki", "<$graph/>\n");
	expect(text).toContain("><span>No graphing libraries installed.</span></div>");
});

it("handles bad global setting gracefully", function() {
	wiki.addTiddler({title: "$:/config/flibbles/graph/engine", text: "Missing"});
	var text = wiki.renderText("text/html", "text/vnd.tiddlywiki", "<$graph/>\n");
	expect(text).toContain("><span>Graph plugin configured to use missing 'Missing' engine. Fix this in plugin settings.</span></div>");
});

it("performs complete refresh if engine changes", async function() {
	var alsoInit = spyOn($tw.test.adapterAlso, "init");
	wiki.addTiddler({title: "target", text: "Test"});
	var widget = $tw.test.renderText(wiki, "<$graph $height=30px $width=50px property=persists $engine={{target}}><$node $tiddler=A/><$node $tiddler=B/><$edge $from=A $to=B/>");
	await $tw.test.flushChanges();
	wiki.addTiddler({title: "target", text: "Also"});
	await $tw.test.flushChanges();
	expect(update).not.toHaveBeenCalled();
	expect(destroy).toHaveBeenCalled();
	expect(alsoInit).toHaveBeenCalledTimes(1);
	// Let's make sure it didn't hold onto old objects from the old engine.
	var objects = alsoInit.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {}, B: {}});
	expect(Object.values(objects.edges)).toEqual([{from: "A", to: "B"}]);
	// make sure dimensions carry over
	// make sure the graph properties properly carry over
	expect(objects.graph).toEqual({property: "persists"});
});

it("handles switching to a bad engine", async function() {
	wiki.addTiddler({title: "target", text: "Test"});
	var widget = $tw.test.renderText(wiki, "<$graph $engine={{target}} />\n");
	await $tw.test.flushChanges();
	wiki.addTiddler({title: "target", text: "Missing"});
	await $tw.test.flushChanges();
	expect(update).not.toHaveBeenCalled();
	expect(destroy).toHaveBeenCalled();
	// There should only be the error widget. No canvas
	expect(widget.parentDomNode.innerHTML).toContain("not found");
	expect(widget.parentDomNode.innerHTML).not.toContain("<canvas");
	// If $graph doesn't properly execute, and holds old data, a crash happens.
});

it("detects change of global engine configuration", async function() {
	var alsoInit = spyOn($tw.test.adapterAlso, "init");
	wiki.addTiddler({title: "$:/config/flibbles/graph/engine", text: "Test"});
	var widget = $tw.test.renderText(wiki, "<$graph/>\n");
	await $tw.test.flushChanges();
	wiki.addTiddler({title: "$:/config/flibbles/graph/engine", text: "Also"});
	await $tw.test.flushChanges();
	expect(update).not.toHaveBeenCalled();
	expect(destroy).toHaveBeenCalled();
	expect(alsoInit).toHaveBeenCalled();
});

it("does not refresh explicit engine if global changes", async function() {
	wiki.addTiddler({title: "$:/config/flibbles/graph/engine", text: "Test"});
	var widget = $tw.test.renderText(wiki, "<$graph $engine=Test/>\n");
	await $tw.test.flushChanges();
	init.calls.reset();
	wiki.addTiddler({title: "$:/config/flibbles/graph/engine", text: "Also"});
	await $tw.test.flushChanges();
	expect(destroy).not.toHaveBeenCalled();
	expect(init).not.toHaveBeenCalled();
});

it("sets the graphengine property for all internal widgets", async function() {
	wiki.addTiddler({title: "Engine", text: "Test"});
	var widget = $tw.test.renderText(wiki, "<$graph $engine={{Engine}} >\n\n=<<graphengine>>=\n");
	expect(widget.parentDomNode.innerHTML).toContain("=Test=");
	wiki.addTiddler({title: "Engine", text: "Also"});
	await $tw.test.flushChanges();
	expect(widget.parentDomNode.innerHTML).toContain("=Also=");
	wiki.addTiddler({title: "Engine"});
	await $tw.test.flushChanges();
	expect(widget.parentDomNode.innerHTML).toContain("=Test=");
	// Now what happens if an unknown engine is inputted?
	wiki.addTiddler({title: "Engine", text: "No-exists"});
	await $tw.test.flushChanges();
	expect(widget.parentDomNode.innerHTML).toContain("library not found");
});

/*** Typecasting ***/

it("converts numbers", function() {
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A label=string size=5/><$node $tiddler=B size=0/><$node $tiddler=C size='-5' /><$edge $from=A $to=B width=5/>");
	var objects = init.calls.first().args[1];
	// B ensures that 0, which is falsy, still passes through fine.
	// C ensures that we respect minimum allowed values.
	expect(objects.nodes).toEqual({A: {label: "string", size: 5}, B: {size: 0}, C: {size: 0}});
	expect(Object.values(objects.edges)).toEqual([{from: "A", to: "B", width: 5}]);
});

it("converts booleans", function() {
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A label=string hidden=no/><$node $tiddler=B hidden=yes/><$node $tiddler=C hidden=true />");
	var objects = init.calls.first().args[1];
	// B ensures that 0, which is falsy, still passes through fine.
	// C ensures that we respect minimum allowed values.
	expect(objects.nodes).toEqual({A: {label: "string", hidden: false}, B: {hidden: true}, C: {hidden: true}});
});

it("treats actions as booleans to the engine", function() {
	var widget = $tw.test.renderText(wiki, `<$graph>
		<$node $tiddler=A delete='<$action-test/>' />
		<$node $tiddler=B delete=<<nothing>> />`);
	var objects= init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {delete: true}, B: {}});
});

/*** View attributes ***/

it("converts graph attributes", async function() {
	wiki.addTiddler({title: "Physics", text: "yes"});
	var widget = $tw.test.renderText(wiki, "<$graph physics={{Physics}} />");
	var objects = onlyCallOf(init)[1];
	expect(objects).toEqual({graph: {physics: true}});
	wiki.addTiddler({title: "Physics", text: "no"});
	await $tw.test.flushChanges();
	var newObjects = onlyCallOf(update)[0];
	expect(newObjects).toEqual({graph: {physics: false}});
});

it("passes along only non-$ attributes as graph settings", function() {
	var widget = $tw.test.renderText(wiki, "<$graph $width=5 $height=10 $else=ignore something=here and=this empty={{noexist}} />");
	var object = init.calls.first().args[1];
	expect(object).toEqual({graph: {something: "here", and: "this"}});
});

it("refreshes graph only when graph attributes change", async function() {
	wiki.addTiddler({title: "Target", text: "this"});
	wiki.addTiddler({title: "Shared", text: "Shared_this"});
	var widgetNode = $tw.test.renderText(wiki, '<$graph value={{Target}} shared={{Shared}} ><$node $tiddler=A value={{Shared}} />')
	await $tw.test.flushChanges();
	var initialObjects = onlyCallOf(init)[1];
	expect(initialObjects).toEqual({graph: {value: "this", shared: "Shared_this"}, nodes: {A: {value: "Shared_this"}}});
	// Now we make a change
	wiki.addTiddler({title: "Target", text: "that"});
	await $tw.test.flushChanges();
	var newObjects = onlyCallOf(update)[0];
	update.calls.reset();
	expect(newObjects).toEqual({graph: {value: "that", shared: "Shared_this"}});
	// Now we make sure we can change the graph and objects at the same time
	wiki.addTiddler({title: "Shared", text: "Shared_that"});
	await $tw.test.flushChanges();
	var newObjects = onlyCallOf(update)[0];
	expect(newObjects).toEqual({graph: {value: "that", shared: "Shared_that"}, nodes: {A: {value: "Shared_that"}}});
});

/*** Error handling ***/

it("handles init errors", async function() {
	init.and.callFake(()=>{throw error});
	var error = new Error("Init Error"),
		message = error.message || error.toString(),
		log = spyOn(console, "error"),
		widgetNode = $tw.test.renderText(wiki, "<$graph>\n\nContent");
	// We ask the error for its message, because it's different between
	// Node.js and the browser
	var graphNode = widgetNode.parentDomNode.childNodes[0];
	expect(graphNode.innerHTML).toBe("<span>"+message+"</span>");
	expect(graphNode.className).toBe("graph-canvas graph-error");
	expect(log).toHaveBeenCalled();
	// Make sure it doesn't crash when refreshing
	await $tw.test.flushChanges();
	// Also, make sure adapter##destroy wasn't called.
	// It should not be, because it was never successfully initialized.
	expect(destroy).not.toHaveBeenCalled();
});

it("handles update errors", async function() {
	var error = new Error("Update Error"),
		message = error.message || error.toString(),
		log = spyOn(console, "error"),
		widgetNode = $tw.test.renderText(wiki, "<$graph value={{Value}}>\n\nContent</$graph>\n");
	// Make sure it doesn't crash when refreshing
	await $tw.test.flushChanges();
	update.and.callFake(()=>{ throw error; });
	wiki.addTiddler({title: "Value", text: "newValue"});
	await $tw.test.flushChanges();
	var graphNode = widgetNode.parentDomNode.childNodes[0];
	expect(graphNode.innerHTML).toContain("<span>"+message+"</span>");
	expect(graphNode.className).toBe("graph-canvas graph-error");
	expect(log).toHaveBeenCalled();
	// It was initialized, so it should have had a chance to deconstruct
	expect(destroy).toHaveBeenCalled();
});

it("can recover from error state", async function() {
	var error = new Error("Init Error"),
		log = spyOn(console, "error");
	init.and.throwError(error);
	var widgetNode = $tw.test.renderText(wiki, "<$graph value={{Value}}><$node $tiddler=A/>");
	expect(widgetNode.parentDomNode.innerHTML).toContain("Init Error");
	expect(log).toHaveBeenCalled();
	await $tw.test.flushChanges();
	init.and.callThrough();
	wiki.addTiddler({title: "Value", text: "newValue"});
	await $tw.test.flushChanges();
	var objects = $tw.test.latestEngine.objects;
	expect(objects).toEqual({ graph: {value: "newValue"}, nodes: {A: {}}});
	expect(widgetNode.parentDomNode.innerHTML).not.toContain("graph-error");
});

});
