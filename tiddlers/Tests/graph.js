/*\

Tests that graphs properly refresh.

\*/

describe('GraphWidget', function() {

var wiki, init, update, register, window;

beforeEach(function() {
	wiki = new $tw.Wiki();
	({update, init, destroy, register, window} = $tw.test.setSpies());
});


function clean(objects) {
	objects.edges = Object.values(objects.edges);
	return objects;
};

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
	var widgetNode = $tw.test.renderText(wiki, "<$graph><$list filter='[tag[node]]'><$node label={{!!caption}} />");
	await $tw.test.flushChanges();
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

it('handles updates to edges', async function() {
	wiki.addTiddlers([
		{title: "A", tags: "node"},
		{title: "B", tags: "node", list: "A"},
		{title: "C", tags: "node"},
		{title: "D", tags: "node", list: "A B"}]);
	var widgetNode = $tw.test.renderText(wiki, "<$graph><$list filter='[tag[node]]'><$node /><$list variable=to filter='[list[]]'><$edge to=<<to>> label={{!!toLabel}} />");
	await $tw.test.flushChanges();
	expect(Object.values($tw.test.latestEngine.objects.edges)).toEqual([
		{from: "B", to: "A"}, {from: "D", to: "A"}, {from: "D", to: "B"}]);
	// Now we add and remove a node to the graph
	wiki.addTiddlers([
		{title: "B", tags: "node", list: "A", toLabel: "newLabel"},
		{title: "D", tags: "node", list: "A C"}]);
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalledTimes(1);
	expect(clean(update.calls.first().args[0])).toEqual({edges: [
		{from: "B", to: "A", label: "newLabel"},
		null,
		{from: "D", to: "C"}]});
	expect(Object.values($tw.test.latestEngine.objects.edges)).toEqual([
		{from: "B", to: "A", label: "newLabel"},
		{from: "D", to: "A"},
		null,
		{from: "D", to: "C"}]);
});

it('handles incomplete edges completed later', async function() {
	wiki.addTiddlers([
		{title: "A", tags: "node"},
		{title: "B"}]);
	var widgetNode = $tw.test.renderText(wiki, "<$graph><$list filter='[tag[node]]'><$node /></$list><$edge from=A to=B />");
	await $tw.test.flushChanges();
	var objects = $tw.test.latestEngine.objects;
	expect(objects.nodes).toEqual({A:{}});
	expect(objects.edges).toBeUndefined();
	wiki.addTiddler({title: "B", tags: "node"});
	await $tw.test.flushChanges();
	var cleanedArgs = clean(onlyCallOf(update)[0]);
	expect(cleanedArgs).toEqual({nodes: {B: {}}, edges: [{from: "A", to:"B"}]});
});

it('handles edge getting incompleted later', async function() {
	wiki.addTiddlers([
		{title: "A", tags: "node"},
		{title: "B", tags: "node"}]);
	var widgetNode = $tw.test.renderText(wiki, "<$graph><$list filter='[tag[node]]'><$node /></$list><$edge from=A to=B />");
	await $tw.test.flushChanges();
	var objects = clean($tw.test.latestEngine.objects);
	expect(objects.nodes).toEqual({A:{}, B:{}});
	expect(objects.edges).toEqual([{from: "A", to: "B"}]);
	wiki.addTiddler({title: "B"});
	await $tw.test.flushChanges();
	var cleanedArgs = clean(onlyCallOf(update)[0]);
	expect(cleanedArgs).toEqual({nodes: {B: null}, edges: [null]});
});

it('does not hand over empty edge lists', function() {
	wiki.addTiddler({title: "A"});
	var widgetNode = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A/><$edge from=A to=B />");
	expect(init).toHaveBeenCalledTimes(1);
	// Might expect to have an edge object because one was added,
	// and then trimmed. But we should be better than that.
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {}});
	expect(objects.edges).toBeUndefined();
});

it('does not send update if no graph objects changed', async function() {
	wiki.addTiddlers([{title: "A"},{title: "Other"}]);
	var widgetNode = $tw.test.renderText(wiki, "<$graph>{{Other}}");
	wiki.addTiddler({title: "Other", text: "New content"});
	await $tw.test.flushChanges();
	expect(update).not.toHaveBeenCalled();
});

// TODO: Only edges
// TODO: No edges

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
	expect(window().eventListeners.size).toBe(0);
});

/*** dimensions ***/

it("resizes on literal dimension changes", async function() {
	wiki.addTiddler({title: "dimensions", text: "247"});
	var widgetNode = $tw.test.renderText(wiki, "<$graph $height={{dimensions}} $width={{dimensions}}>\n\n<$node $tiddler=A/>\n");
	await $tw.test.flushChanges();
	expect(init).toHaveBeenCalled();
	expect(widgetNode.parentDomNode.innerHTML).toContain("height:247");
	expect(widgetNode.parentDomNode.innerHTML).toContain("width:247");
	wiki.addTiddler({title: "dimensions", text: "300"});
	await $tw.test.flushChanges();
	// We want to update the dimensions, but not refresh the graph
	expect(update).not.toHaveBeenCalled();
	expect(widgetNode.parentDomNode.innerHTML).toContain("height:300");
	expect(widgetNode.parentDomNode.innerHTML).toContain("width:300");
});

it("resizes on filter dimension changes", async function() {
	wiki.addTiddler({title: "dimensions", text: "27"});
	var widgetNode = $tw.test.renderText(wiki, "\\function .D() [{dimensions}]\n<$graph $height='[<.D>]' $width='[<.D>add[10]]'>\n");
	await $tw.test.flushChanges();
	expect(init).toHaveBeenCalled();
	expect(widgetNode.parentDomNode.innerHTML).toContain("width:37;height:27;");
	wiki.addTiddler({title: "dimensions", text: "30"});
	await $tw.test.flushChanges();
	expect(update).not.toHaveBeenCalled();
	expect(widgetNode.parentDomNode.innerHTML).toContain("width:40;height:30;");
});

it("can remove dimension attributes", async function() {
	wiki.addTiddler({title: "dimensions", text: "27"});
	var widgetNode = $tw.test.renderText(wiki, "<$graph $height={{dimensions}} $width={{dimensions}} />\n\n");
	await $tw.test.flushChanges();
	expect(widgetNode.parentDomNode.innerHTML).toContain("width:27;height:27;");
	wiki.addTiddler({title: "dimensions"});
	await $tw.test.flushChanges();
	// There will still be style="height:;width:;", but I don't know how to
	// get rid of that.
	expect(widgetNode.parentDomNode.innerHTML).not.toContain(":27;");
});

it("can have dimension attributes return nothing", async function() {
	wiki.addTiddler({title: "dimensions", text: "27"});
	var widgetNode = $tw.test.renderText(wiki, "<$graph $height='[{dimensions}]' $width='[{dimensions}]' />\n");
	await $tw.test.flushChanges();
	expect(widgetNode.parentDomNode.innerHTML).toContain("width:27;height:27;");
	wiki.addTiddler({title: "dimensions"});
	await $tw.test.flushChanges();
	// There will still be style="height:;width:;", but I don't know how to
	// get rid of that.
	expect(widgetNode.parentDomNode.innerHTML).not.toContain(":27;");
});

it("does not write any style info if no dimensions supplied", function() {
	function render(text) {
		return wiki.renderText("text/html", "text/vnd.tiddlywiki", text);
	};
	expect(render("<$graph/>\n\n")).toBe('<div class="graph-canvas"></div>');
	expect(render("<$graph $width='' $height=''/>\n\n")).toBe('<div class="graph-canvas"></div>');
	expect(render("<$graph $width=5px/>\n\n")).toBe('<div class="graph-canvas" style="width:5px;"></div>');
	expect(render("<$graph $height=5px/>\n\n")).toBe('<div class="graph-canvas" style="height:5px;"></div>');
	// Has a filter, but filter returns nothing
	expect(render("<$graph $width='[match[x]]' $height='[match[x]]'/>\n")).toBe('<div class="graph-canvas"></div>');
	expect(render("<$graph $width='[[]]' $height='[[]]'/>\n")).toBe('<div class="graph-canvas"></div>');
});

it("can use browser info for dimension attributes", function() {
	var createElement = $tw.fakeDocument.createElement;
	spyOn($tw.fakeDocument, "createElement").and.callFake(function() {
		var element = createElement.apply(this, arguments);
		element.getBoundingClientRect = () => ({top: 17, left: 13});
		return element;
	});
	function test(text, expected) {
		var output = wiki.renderText("text/html", "text/vnd.tiddlywiki", text);
		expect(output).toContain(expected);
	};
	var win = window();
	win.innerWidth = 53;
	win.innerHeight = 34;
	test("<$graph $width='[<windowWidth>]'/>\n", "width:53;");
	test("<$graph $height='[<windowHeight>]'/>\n", "height:34;");
	test("<$graph $width='[<boundingLeft>]'/>\n", "width:13;");
	test("<$graph $height='[<boundingTop>]'/>\n", "height:17;");
});

it("handles resize events", function() {
	var win = window();
	win.innerWidth = 53;
	win.innerHeight = 34;
	var widgetNode = $tw.test.renderText(wiki, "<$graph $height='[<windowHeight>]' $width='[<windowWidth>]' />\n");
	expect(widgetNode.parentDomNode.innerHTML).toContain("width:53;height:34;");
	win.innerWidth = 7;
	win.innerHeight = 11;
	win.dispatchEvent({type: "resize"});
	expect(widgetNode.parentDomNode.innerHTML).toContain("width:7;height:11;");
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

/*** $engine attribute ***/

// TODO: Also make it not refresh if global setting gets set, but doesn't change outcome? Maybe too much?
it("uses first available engine if none specified", function() {
	var First = function() {};
	First.prototype.init = function(){};
	First.prototype.render = function(){};
	spyOn($tw.test.utils, "getEngineMap").and.returnValue({anything: First});
	var alsoInit = spyOn(First.prototype, "init");
	var text = wiki.renderText("text/html", "text/vnd.tiddlywiki", "<$graph/>")
	expect(alsoInit).toHaveBeenCalled();
});

it("does not let blank $engine value override settings", function() {
	wiki.addTiddler({title: "$:/config/flibbles/graph/engine", text: "Test"});
	var text = wiki.renderText("text/html", "text/vnd.tiddlywiki", "<$graph $engine={{missing}} />")
	expect(init).toHaveBeenCalled();
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
	var widget = $tw.test.renderText(wiki, "<$graph $height=30px $width=50px property=persists $engine={{target}}><$node $tiddler=A/><$node $tiddler=B/><$edge from=A to=B/>");
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
	expect(widget.parentDomNode.innerHTML).toContain("width:50px;height:30px;");
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

/*** Typecasting ***/

it("converts numbers", function() {
	var widget = $tw.test.renderText(wiki, "<$graph><$node $tiddler=A label=string size=5/><$node $tiddler=B size=0/><$node $tiddler=C size='-5' /><$edge from=A to=B width=5/>");
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
