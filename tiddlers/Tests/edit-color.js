/*\

Tests the edit-color widget.

\*/

describe('EditColorWidget', function() {

var wiki, window;

const prefix = "\\procedure colour(name) <$transclude $tiddler=<<name>>/>\n";

beforeEach(function() {
	wiki = new $tw.Wiki();
	({window} = $tw.test.setSpies());
});

/*** Still works like <$edit-text /> ***/

it("properly displays hex colors like normal", function() {
	wiki.addTiddler({title: "Target", text: "#00ff00"});
	var widget = $tw.test.renderText(wiki, `<$edit-color tiddler=Target />\n`);
	var editElement = widget.parentDomNode.children[0];
	expect(editElement.value).toBe("#00ff00");
	expect(editElement.getAttribute("type")).toBe("color");
});

it("properly displays non-existent colors like normal", function() {
	var widget = $tw.test.renderText(wiki, `<$edit-color tiddler=Target />\n`);
	var editElement = widget.parentDomNode.children[0];
	expect(editElement.value).toBe("");
});

it("properly displays empty colors like normal", function() {
	wiki.addTiddler({title: "Target", text: ""});
	var widget = $tw.test.renderText(wiki, `<$edit-color tiddler=Target />\n`);
	var editElement = widget.parentDomNode.children[0];
	expect(editElement.value).toBe("");
});

it("property displays css colors", function() {
	wiki.addTiddler({title: "Target", text: "red"});
	var widget = $tw.test.renderText(wiki, prefix + `<$edit-color tiddler=Target />\n`);
	var editElement = widget.parentDomNode.children[0];
	expect(editElement.value).toBe("red");
});

it("property displays broken colors", function() {
	wiki.addTiddler({title: "Target", text: "broken"});
	var widget = $tw.test.renderText(wiki, prefix + `<$edit-color tiddler=Target />\n`);
	var editElement = widget.parentDomNode.children[0];
	expect(editElement.value).toBe("broken");
});

it("can pull from index like edit-text can", function() {
	var json = JSON.stringify({A: "#aabbcc"});
	wiki.addTiddler({title: "Target", type: "application/json", text: json});
	var widget = $tw.test.renderText(wiki, `<$edit-color tiddler=Target index=A />\n`);
	var editElement = widget.parentDomNode.children[0];
	expect(editElement.value).toBe("#aabbcc");
});

it("can pull from fields like edit-text can", function() {
	wiki.addTiddler({title: "Target", myField: "#bbccaa"});
	var widget = $tw.test.renderText(wiki, `<$edit-color tiddler=Target field=myField />\n`);
	var editElement = widget.parentDomNode.children[0];
	expect(editElement.value).toBe("#bbccaa");
});

/*** Handles palette colors ***/

it("properly displays specified palette colors", async function() {
	wiki.addTiddlers([
		{title: "Target", text: "graph-color"},
		{title: "graph-color", text: "#bbccdd"}]);
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, prefix + `<$edit-color tiddler=Target />\n`);
	expect(widget.parentDomNode.children[0].value).toBe("#bbccdd");
	wiki.addTiddler({title: "graph-color", text: "#112233"});
	var spy = spyOn(widget.children[0].children[0], "updateEditorDomNode");
	await $tw.test.flushChanges();
	// Because we're on a fake DOM, we have to spy, because the core TW
	// edit-text won't actually updates itself.
	expect(spy).toHaveBeenCalledWith("#112233", "color");
	// Let's make sure it doesn't update if nothing relevant changes
	spy.calls.reset();
	wiki.addTiddler({title: "irrelevant", text: "whatever"});
	await $tw.test.flushChanges();
	expect(spy).not.toHaveBeenCalled();
});

it("properly displays default palette colors", async function() {
	wiki.addTiddlers([
		{title: "graph-color", text: "#bbccdd"}]);
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, prefix + `<$edit-color default=graph-color tiddler=Target />\n`);
	expect(widget.parentDomNode.children[0].value).toBe("#bbccdd");
	wiki.addTiddler({title: "graph-color", text: "#112233"});
	var spy = spyOn(widget.children[0].children[0], "updateEditorDomNode");
	await $tw.test.flushChanges();
	// Because we're on a fake DOM, we have to spy, because the core TW
	// edit-text won't actually updates itself.
	expect(spy).toHaveBeenCalledWith("#112233", "color");
	// Let's make sure it doesn't update if nothing relevant changes
	spy.calls.reset();
	wiki.addTiddler({title: "irrelevant", text: "whatever"});
	await $tw.test.flushChanges();
	expect(spy).not.toHaveBeenCalled();
});

});
