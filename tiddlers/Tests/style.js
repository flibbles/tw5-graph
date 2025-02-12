/*\

Tests the $style widget.

\*/

describe("StyleWidget", function() {

var TestEngine = $tw.modules.applyMethods("graphengineadapter").Test;

it('can hierarchically apply style to all nested', function() {
	var initialize = spyOn(TestEngine.prototype, "initialize").and.callThrough();
	var wiki = new $tw.Wiki();
	var widget = $tw.test.renderText(wiki, "<$graph><$style $for=nodes custom=val dynamic=1><$style $for=nodes dynamic=2><$node tiddler=A label=label/><$node tiddler=B/><$edge from=A to=B/></$style><$node tiddler=C/></$style><$node tiddler=D/>");
	expect(initialize).toHaveBeenCalledTimes(1);
	var objects = initialize.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {custom: "val", dynamic: "2", label: "label"}, B: {custom: "val", dynamic: "2"}, C: {custom: "val", dynamic: "1"}, D: {}});
	expect(Object.values(objects.edges)).toEqual([{from: "A", to: "B"}]);
});

it('can hierarchically apply styles to filtered nested', function() {
	var initialize = spyOn(TestEngine.prototype, "initialize").and.callThrough();
	var wiki = new $tw.Wiki();
	var widget = $tw.test.renderText(wiki, `\\whitespace trim
		<$graph>
			<$style $for=nodes $filter="[match[A]] [match[B]] [match[E]]" custom=val dynamic=1>
				<$style $for=nodes $filter="[match[B]] [match[C]]" dynamic=2>
					<$node tiddler=A/>
					<$node tiddler=B/>
					<$node tiddler=C/>
					<$node tiddler=D/>
				</$style>
				<$node tiddler=E/>
			</$style>
			<$node tiddler=F/>
		</$graph>`);
	expect(initialize).toHaveBeenCalledTimes(1);
	var objects = initialize.calls.first().args[1];
	expect(objects.nodes).toEqual({
		A: {custom: "val", dynamic: "1"},
		B: {custom: "val", dynamic: "2"},
		C: {dynamic: "2"},
		D: {},
		E: {custom: "val", dynamic: "1"},
		F: {}});
});

it('can handle changes to style properties', async function() {
	var initialize = spyOn(TestEngine.prototype,"initialize").and.callThrough();
	var update = spyOn(TestEngine.prototype, "update").and.callThrough();
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "Special", text: "from"});
	var widget = $tw.test.renderText(wiki, `\\whitespace trim
		<$graph>
			<$style $for=nodes layer=1>
				<$style $for=nodes $filter="[match[A]] [match[C]]" special={{Special}} layer=2>
					<$style layer=3>
						<$node tiddler=A/>
						<$node tiddler=B/>
					</$style>
					<$node tiddler=C/>
				</$style>
				<$node tiddler=D/>
			</$style>
		</$graph>`);
	var objects = initialize.calls.first().args[1];
	await $tw.test.flushChanges();
	expect(objects.nodes).toEqual({
		A: {layer: "3", special: "from"},
		B: {layer: "3"},
		C: {layer: "2", special: "from"},
		D: {layer: "1"}});
	wiki.addTiddler({title: "Special", text: "to"});
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalledTimes(1);
	expect(update).toHaveBeenCalledWith({nodes: {A: {layer: "3", special: "to"}, C: {layer: "2", special: "to"}}});
});

it('updates when $filter output would be only change', async function() {
	var update = spyOn(TestEngine.prototype, "update").and.callThrough();
	var wiki = new $tw.Wiki();
	wiki.addTiddler({title: "List", tags: "A B"});
	var widget = $tw.test.renderText(wiki, "<$graph><$style value=X $filter='[all[]] :filter[tagging[]match[List]]'><$node tiddler=A/><$node tiddler=B/><$node tiddler=C/>");
	await $tw.test.flushChanges();
	// The fun thing about this update is it will not flag any widgets as
	// changed from the usual methods. We must realize that A and C are swapped
	// out by running the $style filter during refresh.
	wiki.addTiddler({title: "List", tags: "B C"});
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalledWith({nodes: {A: {}, C: {value: "X"}}});
});

});
