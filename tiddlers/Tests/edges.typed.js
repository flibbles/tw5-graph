/*\

Tests the edges.typed macro widget.

\*/

describe('edges.typed \\widget', function() {

var wiki, init;

beforeEach(async function() {
	wiki = new $tw.Wiki();
	({init} = $tw.test.setSpies());
	await $tw.test.setGlobals(wiki);
});

function relinkConfig(name, type) {
	return {title: "$:/config/flibbles/relink/fields/" + name, text: type};
};

function fieldConfig(name, properties) {
	return {
		title: "$:/config/flibbles/graph/edges/fields/" + name,
		text: JSON.stringify(properties),
		type: "application/json"};
};

function formulaConfig(name, filter, properties) {
	return {
		title: "$:/config/flibbles/graph/edges/formulas/" + name,
		filter: filter,
		text: JSON.stringify(properties || {}),
		type: "application/json"};
};

function nodesFor() {
	return Array.prototype.map.call(arguments, x => `<$node $tiddler="${x}"/>`).join("");
};

it("passes along filter arguments to internal macros", function() {
	wiki.addTiddlers([
		fieldConfig("fieldA", {}),
		fieldConfig("fieldB", {}),
		{title: "Target", fieldA: "A", fieldB: "B", text: "[[L]] {{T}}"}]);
	var text = "<$edges.typed $formulas=links $fields=fieldB $tiddler=Target><<toTiddler>>";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>BL</p>");
});

it("defaults to defaultTiddler", function() {
	wiki.addTiddlers([
		{title: "Target", text: "[[L]]"}]);
	var text = "\\define currentTiddler() Target\n<$edges.typed><<toTiddler>>";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>L</p>");
});

it("passes along edit argument to internal macros", function() {
	wiki.addTiddlers([
		fieldConfig("fieldA", {}),
		{title: "$:/config/TimestampDisable", text: "yes"},
		{title: "from", fieldA: "field"}]);
	var text = "<$graph><$edges.typed $tiddler=from $editable=yes/>"+nodesFor("from", "field");
	var widget = $tw.test.renderGlobal(wiki, text);
	var edges = $tw.test.latestEngine.objects.edges;
	var id = Object.keys(edges)[0];
	expect(edges[id]).toEqual({from: "from", to: "field", delete: true});
	$tw.test.dispatchEvent(wiki, {objectType: "edges", id: id, type: "delete"}, {});
	expect(wiki.getTiddler("from").fields).toEqual({title: "from"});
});

it("makes edges for both types by default", function() {
	wiki.addTiddlers([
		fieldConfig("fieldA", {value: "A"}),
		{title: "from", fieldA: "field", text: "[[link]] {{transclude}}"}]);
	var text = "<$graph><$edges.typed $tiddler=from/>" + nodesFor("from", "field", "link", "transclude");
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(init).toHaveBeenCalledTimes(1);
	var objects = init.calls.first().args[1];
	expect(Object.values(objects.edges)).toEqual([
		{from: "from", to: "field", value: "A"},
		{from: "from", to: "link", label: "links to"},
		{from: "from", to: "transclude", label: "transcludes"}]);
});

it("has even depth with its blocks", function() {
	wiki.addTiddlers([
		fieldConfig("fieldA", {}),
		{title: "Target", fieldA: "A", text: "[[L]]"}]);
	var text = "\\widget $.test() <$edges.typed $tiddler=Target><$slot $name=ts-raw $depth=2/>\n<$.test><<toTiddler>>";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>AL</p>");
});

it("makes dataTiddler available for all edge types", function() {
	wiki.addTiddlers([
		fieldConfig("fieldA", {}),
		{title: "Target", fieldA: "A", text: "[[L]] [[R]]"}]);
	var text = "<$edges.typed $tiddler=Target>=<$text text={{{ [<dataTiddler>split[/]last[]] }}}/>";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>=fieldA=links=links</p>");
});

it("does not introduce whitespace with default block", function() {
	wiki.addTiddlers([
		{title: "Target", text: "[[X]] [[Y]] [[Z]]", list: "A B C"}]);
	var text = "<$edges.typed $tiddler=Target />\n";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("");
});

it("makes unique ids for edges", function() {
	wiki.addTiddlers([
		fieldConfig("A", {value: "1"}),
		fieldConfig("B", {value: "2"}),
		relinkConfig("A", "filter"),
		formulaConfig("A", "[all[]] =[all[]]", {value: "3"}),
		formulaConfig("B", "[all[]]", {value: "4"}),
		{title: "Target", "A": "Target =Target", "B": "Target"}]);
	var text = "<$graph><$edges.typed $tiddler=Target />" + nodesFor("Target");
	var widget = $tw.test.renderGlobal(wiki, text);
	var objects = init.calls.first().args[1];
	expect(Object.values(objects.edges)).toEqual([
		{from: "Target", to: "Target", value: "1"},
		{from: "Target", to: "Target", value: "1"},
		{from: "Target", to: "Target", value: "2"},
		{from: "Target", to: "Target", value: "3"},
		{from: "Target", to: "Target", value: "3"},
		{from: "Target", to: "Target", value: "4"}]);
	// Now let's make sure that the blocks get access to these unique ids
	widget = $tw.test.renderGlobal(wiki, "<$edges.typed $tiddler=Target>\n\n<$text text=<<id>> />\n\n<br>\n");
	var output = widget.parentDomNode.innerHTML;
	var expected = Object.keys(objects.edges);
	expected.push(""); // We add one more because we have a superfluous <br> at the end.
	expect(output.split("<br>")).toEqual(expected);
});

/*** Field specific tests ***/

it("uses all fieldTyped edges when no fields specified", function() {
	wiki.addTiddlers([
		fieldConfig("fieldA", {value: "A"}),
		fieldConfig("fieldB", {value: "B"}),
		relinkConfig("fieldA", "title"),
		{title: "from", fieldA: "to this", fieldB: "to this"}]);
	var text = "<$graph><$edges.typed $tiddler=from/>" + nodesFor("from", "to", "this", "to this");
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(init).toHaveBeenCalledTimes(1);
	var objects = init.calls.first().args[1];
	expect(Object.values(objects.edges)).toEqual([
		{from: "from", to: "to this", value: "A"},
		{from: "from", to: "to", value: "B"},
		{from: "from", to: "this", value: "B"}]);
});

it("handles non-fieldTyped edges when specified", function() {
	wiki.addTiddlers([
		fieldConfig("fieldA", {value: "A"}),
		fieldConfig("fieldB", {value: "B"}),
		relinkConfig("fieldA", "title"),
		{title: "from", fieldA: "to this", fieldB: "to this", fieldC: "C D"}]);
	var text = "<$graph><$edges.typed $fields='fieldB fieldC' $tiddler=from/>" + nodesFor("from", "to", "this", "to this", "C", "D");
	var widget = $tw.test.renderGlobal(wiki, text);
	var objects = init.calls.first().args[1];
	expect(Object.values(objects.edges)).toEqual([
		{from: "from", to: "to", value: "B"},
		{from: "from", to: "this", value: "B"},
		{from: "from", to: "C"},
		{from: "from", to: "D"}]);
});

it("can have custom edge fill", function() {
	wiki.addTiddlers([
		fieldConfig("fieldA", {}),
		{title: "from", fieldA: "to"}]);
	var text = "<$edges.typed $tiddler=from>X-<<toTiddler>>";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>X-to</p>");
});

it("currentTiddler remains unchanged for $fields filter", function() {
	wiki.addTiddlers([
		{title: "Info", choice: "fieldB"},
		{title: "from", fieldA: "bad", fieldB: "good"}]);
	var text = "\\define currentTiddler() Info\n<$edges.typed $fields='[<currentTiddler>get[choice]]' $tiddler=from><<toTiddler>>";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>good</p>");
});

it("can delete edges", function() {
	wiki.addTiddlers([
		fieldConfig("fieldA", {value: "A"}),
		relinkConfig("fieldA", "title"),
		{title: "$:/config/TimestampDisable", text: "yes"},
		{title: "from", fieldA: "to there"}]);
	var text = "<$graph><$edges.typed $editable=yes $tiddler=from/>" + nodesFor("from", "to there");
	var widget = $tw.test.renderGlobal(wiki, text);
	var edges = $tw.test.latestEngine.objects.edges;
	var id = Object.keys(edges)[0];
	expect(edges[id]).toEqual({from: "from", to: "to there", value: "A", delete: true});
	$tw.test.dispatchEvent(wiki, {objectType: "edges", id: id, type: "delete"}, {});
	expect(wiki.getTiddler("from").fields).toEqual({title: "from"});
});

it("can update edges when type is changed", async function() {
	wiki.addTiddlers([
		fieldConfig("fieldA", {value: "A"}),
		{title: "from", fieldA: "[[to there]]"}]);
	var text = "<$graph><$edges.typed $tiddler=from/>" + nodesFor("from", "to there");
	var widget = $tw.test.renderGlobal(wiki, text);
	await $tw.test.flushChanges();
	var edges = $tw.test.latestEngine.objects.edges;
	var id = Object.keys(edges)[0];
	expect(edges[id]).toEqual({from: "from", to: "to there", value: "A"});
	// Now changes the type
	wiki.addTiddler(fieldConfig("fieldA", {value: "B"}));
	await $tw.test.flushChanges();
	edges = $tw.test.latestEngine.objects.edges;
	// The id should remain the same, because we don't do a full refresh
	expect(edges).toEqual({[id]: {from: "from", to: "to there", value: "B"}});
});

/*** Formula specific tests ***/

it("can make link and transclude edges for graphs", function() {
	wiki.addTiddlers([
		{title: "from", text: "[[toLink1]] [[toLink2]] {{toTransclude}}"}]);
	var text = "<$graph><$edges.typed $tiddler=from/>" + nodesFor("from", "toLink1", "toLink2", "toTransclude");
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(init).toHaveBeenCalledTimes(1);
	var objects = init.calls.first().args[1];
	expect(Object.values(objects.edges)).toEqual([
		{from: "from", to: "toLink1", label: "links to"},
		{from: "from", to: "toLink2", label: "links to"},
		{from: "from", to: "toTransclude", label: "transcludes"}]);
});

it("can use a custom non-graph block", function() {
	wiki.addTiddler({title: "Target", text: "[[toLink]] {{toTransclude}}"});
	var widget = $tw.test.renderGlobal(wiki, "<$edges.typed $tiddler=Target>=<<toTiddler>>");
	expect(widget.parentDomNode.innerHTML).toBe("<p>=toLink=toTransclude</p>");
});

it("can hand-pick formulas", function() {
	wiki.addTiddler({title: "Target", text: "[[toLink]] {{toTransclude}}"});
	var widget = $tw.test.renderGlobal(wiki, "<$edges.typed $formulas=links $tiddler=Target>=<<toTiddler>>");
	expect(widget.parentDomNode.innerHTML).toBe("<p>=toLink</p>");
});

it("can hand-remove formulas", function() {
	wiki.addTiddler({title: "Target", text: "[[toLink]] {{toTransclude}}"});
	var widget = $tw.test.renderGlobal(wiki, "<$edges.typed $formulas='[all[]] -links' $tiddler=Target>=<<toTiddler>>");
	expect(widget.parentDomNode.innerHTML).toBe("<p>=toTransclude</p>");
});

it("only passes current target to formula filters", function() {
	wiki.addTiddlers([
		{title: "Target", text: "[[toLink]] {{toTransclude}}"},
		{title: "Target2", text: "[[other]] {{bad}}"}]);
	var widget = $tw.test.renderGlobal(wiki, "<$edges.typed $formulas=links $tiddler=Target>=<<toTiddler>>");
	expect(widget.parentDomNode.innerHTML).toBe("<p>=toLink</p>");
});

it("preserves currentTiddler when running formula filter", function() {
	wiki.addTiddlers([
		formulaConfig("myField", "[{!!myField}]"),
		{title: "Target", myField: "bad"},
		{title: "Template", myField: "good"}]);
	var widget = $tw.test.renderGlobal(wiki, "\\define currentTiddler() Template\n<$edges.typed $tiddler=Target>=<<toTiddler>>");
	expect(widget.parentDomNode.innerHTML).toBe("<p>=good</p>");
});

it("uses currentTiddler as default", function() {
	wiki.addTiddler({title: "Target", text: "[[toLink]] {{toTransclude}}"});
	var widget = $tw.test.renderGlobal(wiki, "\\define currentTiddler() Target\n<$edges.typed>=<<toTiddler>>");
	expect(widget.parentDomNode.innerHTML).toBe("<p>=toLink=toTransclude</p>");
});

});
