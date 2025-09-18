/*\

Tests the standard-graph template

\*/

describe('standard-graph template', function() {

var wiki, init, update;

var standardGraph = "$:/plugins/flibbles/graph/templates/standard-graph";
var title = "$:/graph/test";

function view(fields) {
	return Object.assign({title: title, type: "application/json"}, fields);
};

beforeEach(async function() {
	wiki = new $tw.Wiki();
	({init, update} = $tw.test.setSpies());
	// Spy on the modal
	oldModal = $tw.modal;
	$tw.modal = modal = new $tw.utils.Modal(wiki);
	spyOn($tw.modal, "display");
	await $tw.test.setGlobals(wiki);
});

it("physics only applies to non-recorded nodes", function() {
	wiki.addTiddler(view({text: '{\n    "A": "4,5"\n}', filter: "A B"}));
	var widget = $tw.test.renderGlobal(wiki, `{{${title}||${standardGraph}}}`);
	var nodes = init.calls.first().args[1].nodes;
	expect(nodes.A.physics).toBe(false);
	expect(nodes.B.physics).toBe(true);
});

it("can add and remove nodes", async function() {
	wiki.addTiddler(view({text: '{}'}));
	var widget = $tw.test.renderGlobal(wiki, `{{${title}||${standardGraph}}}`);
	$tw.test.dispatchEvent(wiki,
		{objectType: "graph", type: "addNode"},
		{x: "23", y: "29"});
	$tw.rootWidget.dispatchEvent({type: "tm-modal-finish", param: "A"});
	expect(wiki.tiddlerExists("A")).toBe(true);
	await $tw.test.flushChanges();
	expect(wiki.getTiddler(title).fields.text).toBe('{\n    "A": "23,29"\n}');
	expect(wiki.getTiddler(title).fields.filter).toBe("A");
	// Now that we've added it. Let's remove it.
	$tw.test.dispatchEvent(wiki, {objectType: "nodes", type: "delete", id:"A"});
	await $tw.test.flushChanges();
	expect(wiki.getTiddler(title).fields.text).toEqual('{}');
	expect(wiki.getTiddler(title).fields.filter).toBeUndefined();
});

it("filters draft nodes out", function() {
	wiki.addTiddlers([
		view({filter: "[!is[system]]"}),
		{title: "Node"},
		{title: "Draft of 'Node'", "draft.of": "Node", "draft.title": "Node"}]);
	var widget = $tw.test.renderGlobal(wiki, `{{${title}||${standardGraph}}}`);
	var nodes = init.calls.first().args[1].nodes;
	expect(Object.keys(nodes)).toEqual(["Node"]);
});

it("wikifies captions but not titles", async function() {
	var titleA = "//title---A//";
	wiki.addTiddlers([
		view({filter: `${titleA} title---B`}),
		{title: "Macros", tags: "$:/tags/Global", text: "\\procedure test(value) test=''<<value>>''"},
		{title: titleA},
		{title: "title---B", value: "fruit", caption: "<$transclude $variable=test value={{!!value}} />"}]);
	// Something about the refresh dependencies means we need to do this or
	// get a suite error after the test.
	await $tw.test.flushChanges();
	var widget = $tw.test.renderGlobal(wiki, `{{${title}||${standardGraph}}}`);
	var nodes = init.calls.first().args[1].nodes;
	expect(nodes[titleA].label).toBe(titleA);
	expect(nodes["title---B"].label).toBe("test=fruit");
});

it("does not create unnecessary textContent", function() {
	wiki.addTiddlers([ view({filter: `A B`, "neighbors.incoming": "1", "neighbors.outgoing": "1"}), {title: "A", tags: "B Outgoing"}, {title: "Incoming", tags: "A"}]);
	var widget = $tw.test.renderGlobal(wiki, `{{${title}||${standardGraph}}}`);
	var objects = init.calls.first().args[1];
	expect($tw.utils.count(objects.nodes)).toBe(4);
	expect($tw.utils.count(objects.edges)).toBe(3);
	// This is the main test. No text content should be created
	expect(widget.parentDomNode.textContent).toBe("");
	// div.graph-canvas -> (nothing)
	expect(widget.parentDomNode.children[0].innerHTML).toBe("");
});

it("has proper default settings in river", async function() {
	wiki.addTiddler(view({"graph.graph": '{}'}));
	var widget = $tw.test.renderGlobal(wiki, `{{${title}||${standardGraph}}}`);
	var objects = init.calls.first().args[1];
	expect(objects.graph.zoom).toBe(false);
	expect(objects.graph.navigation).toBe(false);
	$tw.test.dispatchEvent(wiki, { type: "focus", objectType: "graph"});
	await $tw.test.flushChanges();
	objects = update.calls.first().args[0];
	// This used to be undefined before I explicitly set it to true
	expect(objects.graph.zoom).toBe(true);
	expect(objects.graph.navigation).toBe(undefined);
});

it("has proper override settings in river", async function() {
	wiki.addTiddler(view({"graph.graph": '{"zoom": "no","navigation":"yes"}'}));
	var widget = $tw.test.renderGlobal(wiki, `{{${title}||${standardGraph}}}`);
	var objects = init.calls.first().args[1];
	expect(objects.graph.zoom).toBe(false);
	expect(objects.graph.navigation).toBe(false);
	$tw.test.dispatchEvent(wiki, { type: "focus", objectType: "graph"});
	await $tw.test.flushChanges();
	objects = update.calls.first().args[0];
	expect(objects.graph.zoom).toBe(false);
	expect(objects.graph.navigation).toBe(true);
});

it("neighbors are disabled by default", function() {
	wiki.addTiddlers([
		view({filter: "target"}),
		{title: "target", tags: "A B"}]);
	var widget = $tw.test.renderGlobal(wiki, `{{${title}||${standardGraph}}}`);
	var objects = init.calls.first().args[1];
	expect(Object.keys(objects.nodes).sort()).toEqual(["target"]);
});

it("neighbor whitelist defaults to [!is[system]]", function() {
	wiki.addTiddlers([
		view({filter: "target", "neighbors.incoming": "1", "neighbors.outgoing": "1"}),
		{title: "target", tags: "A B $:/C"}]);
	var widget = $tw.test.renderGlobal(wiki, `{{${title}||${standardGraph}}}`);
	var objects = init.calls.first().args[1];
	expect(Object.keys(objects.nodes).sort()).toEqual(["A", "B", "target"]);
});

it("exposes raw blocks once when empty", function() {
	wiki.addTiddler({title: title, "graph.nodes": '{"color": "#00ff00"}'});
	var widget = $tw.test.renderGlobal(wiki, `<$tiddler tiddler="${title}"><$transclude $tiddler="${standardGraph}">MyContent`);
	// Our custom content should appear.
	expect(widget.parentDomNode.innerHTML).toContain("MyContent");
});

it("exposes raw blocks once when populated", function() {
	wiki.addTiddler({title: title, filter: "A B", "graph.nodes": '{"color": "#00ff00"}'});
	var widget = $tw.test.renderGlobal(wiki, `<$tiddler tiddler="${title}"><$transclude $tiddler="${standardGraph}">MyContent<$node $tiddler=X/>`);
	var objects = init.calls.first().args[1];
	// The filter nodes should be there, and our custom one too.
	expect(Object.keys(objects.nodes).sort()).toEqual(["A", "B", "X"]);
	// The custom block was inside of our $property widgets, and so picked up
	// our graphTiddler.
	expect(objects.nodes.X.color).toBe("#00ff00");
	// Our custom content should only have showed up once.
	// So when splitting by it, we should end up with only two parts.
	expect(widget.parentDomNode.innerHTML.split("MyContent").length).toBe(2);
});

});
