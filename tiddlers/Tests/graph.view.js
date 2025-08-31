/*\

Tests the graph.view global widget.

\*/

describe('graph.view \\widget', function() {

var wiki, init, update;

beforeEach(async function() {
	wiki = new $tw.Wiki();
	({init, update} = $tw.test.setSpies());
	await $tw.test.setGlobals(wiki);
});

/*** $tiddler and $template attributes ***/

it("uses a standard graph if no template specified", function() {
	wiki.addTiddler({title: "Target", filter: "A"});
	var text = "<$graph.view $tiddler=Target />\n";
	var widget = $tw.test.renderGlobal(wiki, text);
	var objects = init.calls.first().args[1];
	expect(Object.keys(objects.nodes)).toEqual(["A"]);
	expect(widget.parentDomNode.textContent).toBe("");
});

it("uses template specified by the $tiddler", function() {
	wiki.addTiddlers([
		{title: "Target", text: "Target content", template: "Template"},
		{title: "Template", text: "Temp: {{}}"}]);
	var text = "<$graph.view $tiddler=Target />\n";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>Temp: Target content</p>");
});

it("can specify custom $template", function() {
	wiki.addTiddlers([
		{title: "Target", text: "Target content", template: "Template"},
		{title: "Template", text: "Temp: {{}}"},
		{title: "Alternate", text: "Alter: {{}}"}]);
	var text = "<$graph.view $tiddler=Target $template=Alternate/>\n";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>Alter: Target content</p>");
});

it("defaults to Default View if no $tiddler given", function() {
	wiki.addTiddlers([
		{title: "$:/graph/Default", text: "Default content", template: "Template"},
		{title: "Template", text: "Temp: {{}}"}]);
	var text = "<$graph.view />\n";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>Temp: Default content</p>");
});

it("does not introduce unneeded DOM elements when used as block", function() {
	wiki.addTiddlers([
		{title: "Template", text: "<$text text='TemplateBody'/>\n"}]);
	var text =  "<div>\n\n<$graph.view $template=Template/>\n\n</div>";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<div>TemplateBody</div>");
});

/*** Parameters and fills ***/

it("can supply parameters to templates", function() {
	wiki.addTiddlers([
		{title: "Template", text: "\\parameters (A, B:defaultB, C, D:defaultD)\n<<A>>-<<B>>-<<C>>-<<D>>"}]);
	var text = "<$graph.view $template=Template A=inputA B=inputB />\n";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>inputA-inputB--defaultD</p>");
});

it("it does not pass along $dollar parameters", function() {
	wiki.addTiddlers([
		{title: "Template", text: "\\parameters (arg $template:$temExpect, $tiddler:$tidExpect, $other:othExpect, $ignored:ignExpect)\n<<arg>>-<<$template>>-<<$tiddler>>-<<$other>>-<<$ignored>>-<<$undeclared>>"}]);
	// Make sure to specify arg at the very end, it makes sure attr values don't misalign after $dollar attrs are removed
	var text = "<$graph.view $template=Template $other=wrong $undeclared=wrong type=div $type=div $$type=div arg=works/>\n";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>works-$temExpect-$tidExpect-othExpect-ignExpect-</p>");
});

it("can pass along raw fills", function() {
	wiki.addTiddlers([
		{title: "Template", text: "B-<$slot $name=ts-raw/>-A"}]);
	var text = "<$graph.view $template=Template>\n\n<$text text='Content'/>\n";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>B-Content-A</p>");
});

it("can pass along named fills", function() {
	wiki.addTiddlers([
		{title: "Template", text: "B-<$slot $name=named/>-A"}]);
	var text = "<$graph.view $template=Template>\n\n<$fill $name=named>\n\n<$text text='Named'/>\n";
	var widget = $tw.test.renderGlobal(wiki, text);
	expect(widget.parentDomNode.innerHTML).toBe("<p>B-Named-A</p>");
});

});
