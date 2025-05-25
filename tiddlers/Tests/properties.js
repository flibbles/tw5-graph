/*\

Tests the $properties widget.

\*/

describe("PropertiesWidget", function() {

var wiki, init, update, window;

beforeEach(function() {
	wiki = new $tw.Wiki();
	({init, update, window} = $tw.test.setSpies());
});

it('can hierarchically apply style to all nested', function() {
	var widget = $tw.test.renderText(wiki, "<$graph><$properties $for=nodes custom=val dynamic=1><$properties $for=nodes dynamic=2><$node $tiddler=A label=label/><$node $tiddler=B/><$edge $from=A $to=B/></$properties><$node $tiddler=C/></$properties><$node $tiddler=D/>");
	expect(init).toHaveBeenCalledTimes(1);
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {custom: "val", dynamic: "2", label: "label"}, B: {custom: "val", dynamic: "2"}, C: {custom: "val", dynamic: "1"}, D: {}});
	expect(Object.values(objects.edges)).toEqual([{from: "A", to: "B"}]);
});

it('can hierarchically apply styles to filtered nested', function() {
	var widget = $tw.test.renderText(wiki, `\\whitespace trim
		<$graph>
			<$properties $for=nodes $filter="[match[A]] [match[B]] [match[E]]" custom=val dynamic=1>
				<$properties $for=nodes $filter="[match[B]] [match[C]]" dynamic=2>
					<$node $tiddler=A/>
					<$node $tiddler=B/>
					<$node $tiddler=C/>
					<$node $tiddler=D/>
				</$properties>
				<$node $tiddler=E/>
			</$properties>
			<$node $tiddler=F/>
		</$graph>`);
	expect(init).toHaveBeenCalledTimes(1);
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({
		A: {custom: "val", dynamic: "1"},
		B: {custom: "val", dynamic: "2"},
		C: {dynamic: "2"},
		D: {},
		E: {custom: "val", dynamic: "1"},
		F: {}});
});

it('can apply styles to non-node objects, like edges', function() {
	var widget = $tw.test.renderText(wiki, `\\whitespace trim
		<$graph>
			<$edge $from=A $to=C />
			<$properties $for=edges color=blue>
				<$node $tiddler=A/>
				<$node $tiddler=B/>
				<$node $tiddler=C/>
				<$edge $from=A $to=B />
			</$properties>
		</$graph>`);
	expect(init).toHaveBeenCalledTimes(1);
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({
		A: {},
		B: {},
		C: {}});
	expect(Object.values(objects.edges)).toEqual([{from: "A", to: "C"}, {from: "A", to: "B", color: "blue"}]);
});

it('can selectively apply styles to non-node objects, like edges', function() {
	var widget = $tw.test.renderText(wiki, `\\whitespace trim
		<$graph>
			<$properties $for=edges $filter="[suffix[C]]" color=blue>
				<$node $tiddler=A/>
				<$node $tiddler=B/>
				<$node $tiddler=C/>
				<$edge $id=AB $from=A $to=B />
				<$edge $id=AC $from=A $to=C />
				<$edge $id=BC $from=B $to=C />
			</$properties>
		</$graph>`);
	expect(init).toHaveBeenCalledTimes(1);
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({A: {}, B: {}, C: {}});
	expect(objects.edges).toEqual({AB: {from: "A", to: "B"}, AC: {from: "A", to: "C", color: "blue"}, BC: {from: "B", to: "C", color: "blue"}});
});

it('refreshes properly if $for changes when filtering', async function() {
	wiki.addTiddler({title: "for", text: "edges"});
	var widget = $tw.test.renderText(wiki, `\\whitespace trim
		<$graph>
			<$properties $for={{for}} $filter="[prefix[A]]" color=blue>
				<$node $tiddler=A/>
				<$node $tiddler=B/>
				<$edge $id=AB $from=A $to=B />
				<$edge $id=BA $from=B $to=A />
			</$properties>
		</$graph>`);
	await $tw.test.flushChanges();
	wiki.addTiddler({title: "for", text: "nodes"});
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalledTimes(1);
	var objects = update.calls.first().args[0];
	expect(objects.nodes).toEqual({A: {color: "blue"}});
	expect(objects.edges).toEqual({AB: {from: "A", to: "B"}});
});

it('refreshes properly if $for changes when not filtering', async function() {
	wiki.addTiddler({title: "for", text: "edges"});
	var widget = $tw.test.renderText(wiki, `\\whitespace trim
		<$graph>
			<$properties $for={{for}} color=blue>
				<$node $tiddler=A/>
				<$node $tiddler=B/>
				<$edge $from=A $to=B />
				<$edge $from=B $to=A />
			</$properties>
		</$graph>`);
	await $tw.test.flushChanges();
	wiki.addTiddler({title: "for", text: "nodes"});
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalledTimes(1);
	var objects = update.calls.first().args[0];
	expect(objects.nodes).toEqual({A: {color: "blue"}, B: {color: "blue"}});
	expect(Object.values(objects.edges)).toEqual([{from: "A", to: "B"}, {from: "B", to: "A"}]);
});

it('treats empty attributes as non-existent', function() {
	var widget = $tw.test.renderText(wiki, "<$graph><$properties yes=value no={{!!nofield}}><$node $tiddler=target />");
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({target: {yes: "value"}});
});

it("can handle local variables in $filter", async function() {
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, `\\whitespace trim
		<$graph>
			<$let test=B>
			<$properties $filter="[match<test>]" dynamic=1>
				<$let test=C>
				<$properties $filter="[match<test>]" dynamic=2>
					<$node $tiddler=A/>
					<$node $tiddler=B/>
					<$node $tiddler=C/>
				</$properties>
				</$let>
			</$properties>
			</$let>
		</$graph>`);
	expect(init).toHaveBeenCalledTimes(1);
	expect(update).not.toHaveBeenCalled();
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({
		A: {},
		B: {dynamic: "1"},
		C: {dynamic: "2"}});
	// We need to add anything and force any kind of refresh.
	// The $properties refresh mechanism will mess up despite no relevant
	// change if its filterCall isn't passing $properties as the widget.
	wiki.addTiddler({title: "anything"});
	await $tw.test.flushChanges();
	expect(update).not.toHaveBeenCalled();
});

//TODO: If $filter changes, it should only change what filter results change.
it('can handle changes to style properties', async function() {
	wiki.addTiddler({title: "Special", text: "then"});
	var widget = $tw.test.renderText(wiki, `\\whitespace trim
		<$graph>
			<$properties $for=nodes layer=1>
				<$properties $for=nodes $filter="[match[A]] [match[C]]" special={{Special}} layer=2>
					<$properties layer=3>
						<$node $tiddler=A/>
						<$node $tiddler=B/>
					</$properties>
					<$node $tiddler=C/>
				</$properties>
				<$node $tiddler=D/>
			</$properties>
		</$graph>`);
	var objects = init.calls.first().args[1];
	await $tw.test.flushChanges();
	expect(objects.nodes).toEqual({
		A: {layer: "3", special: "then"},
		B: {layer: "3"},
		C: {layer: "2", special: "then"},
		D: {layer: "1"}});
	wiki.addTiddler({title: "Special", text: "now"});
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalledTimes(1);
	expect(update).toHaveBeenCalledWith({nodes: {A: {layer: "3", special: "now"}, C: {layer: "2", special: "now"}}});
});

// Tests for bug where $properties remembers edges too long.
it("can handle removing and modifying edges", async function() {
	wiki.addTiddlers([
		{title: "A", tags: "Node"},
		{title: "B", tags: "Node"},
		{title: "Value", text: "first"}
	]);
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, "<$graph><$properties value={{Value}}><$list filter='[tag[Node]]'><$node/>");
	wiki.deleteTiddler("B");
	await $tw.test.flushChanges();
	update.calls.reset();
	wiki.addTiddler({title: "Value", text: "second"});
	await $tw.test.flushChanges();
	var objects = update.calls.first().args[0];
	expect(objects).toEqual({nodes: {A: {value: "second"}}});
});

/*** $filter manipulation ***/

it('updates when $filter output would be only change', async function() {
	wiki.addTiddler({title: "List", tags: "A B"});
	var widget = $tw.test.renderText(wiki, "<$graph><$properties value=X $filter='[all[]] :filter[tagging[]match[List]]'><$node $tiddler=A/><$node $tiddler=B/><$node $tiddler=C/>");
	await $tw.test.flushChanges();
	// The fun thing about this update is it will not flag any widgets as
	// changed from the usual methods. We must realize that A and C are swapped
	// out by running the $properties filter during refresh.
	wiki.addTiddler({title: "List", tags: "B C"});
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalledWith({nodes: {A: {}, C: {value: "X"}}});
});

it("udates when indirect $filter changes", async function() {
	wiki.addTiddler({title: "Filter", text: "[match[A]]"});
	var widget = $tw.test.renderText(wiki, "<$graph><$properties value=X $filter={{Filter}}><$node $tiddler=A/><$node $tiddler=B/>");
	await $tw.test.flushChanges();
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({
		A: {value: "X"},
		B: {}});
	wiki.addTiddler({title: "Filter", text: "[all[]]"});
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalledWith({nodes: {B: {value: "X"}}});
});

it("udates when indirect $filter is removed", async function() {
	wiki.addTiddler({title: "Filter", text: "[match[A]]"});
	var widget = $tw.test.renderText(wiki, "<$graph><$properties value=X $filter={{Filter}}><$node $tiddler=A/><$node $tiddler=B/>");
	await $tw.test.flushChanges();
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({
		A: {value: "X"},
		B: {}});
	wiki.deleteTiddler("Filter");
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalledWith({nodes: {B: {value: "X"}}});
});

it("updates when indirect $filter is added", async function() {
	var widget = $tw.test.renderText(wiki, "<$graph><$properties value=X $filter={{Filter}}><$node $tiddler=A/><$node $tiddler=B/>");
	await $tw.test.flushChanges();
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({
		A: {value: "X"},
		B: {value: "X"}});
	wiki.addTiddler({title: "Filter", text: "[match[A]]"});
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalledWith({nodes: {B: {}}});
});

it("can add to graph sequentially", function() {
	var widget = $tw.test.renderText(wiki, `<$graph root=yes>
		<$properties $for=graph physics=yes value=1 />
		<$properties $for=graph root=no value=2 />`);
	var objects = init.calls.first().args[1];
	expect(objects.graph).toEqual({ physics: true, value: "2", root: "yes"});
});

it("can update $for=graph", async function() {
	wiki.addTiddler({title: "Value", text: "one"});
	var widget = $tw.test.renderText(wiki, "<$graph><$properties $for=graph value={{Value}}/>");
	await $tw.test.flushChanges();
	var objects = init.calls.first().args[1];
	expect(objects.graph).toEqual({value: "one"});
	wiki.addTiddler({title: "Value", text: "two"});
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalledWith({graph: {value: "two"}});
});

it("prevents unnecessary updates from $for=graph", async function() {
	wiki.addTiddler({title: "Value", text: "one"});
	var widget = $tw.test.renderText(wiki, "<$graph value=override><$properties $for=graph value={{Value}}/>");
	await $tw.test.flushChanges();
	var objects = init.calls.first().args[1];
	expect(objects.graph).toEqual({value: "override"});
	wiki.addTiddler({title: "Value", text: "two"});
	await $tw.test.flushChanges();
	expect(update).not.toHaveBeenCalled();
});

/*** $tiddler attribute ***/

it("can override properties from a tiddler", function() {
	wiki.addTiddler({title: "Properties", type: "application/json", text: JSON.stringify({value: "good", override: "baseValue"})});
	var widget = $tw.test.renderText(wiki, "<$graph><$properties $tiddler=Properties override=newValue><$node $tiddler=N />");
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({N: {value: "good", override: "newValue"}});
});

it("can point to a nonexistent data tiddler", function() {
	var widget = $tw.test.renderText(wiki, "<$graph><$properties $tiddler=Properties key=value><$node $tiddler=N />");
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({N: {key: "value"}});
});

it("does not accept blank values from data tiddler", function() {
	wiki.addTiddler({title: "Properties", type: "application/json", text: JSON.stringify({value: "good", empty: ""})});
	var widget = $tw.test.renderText(wiki, "<$graph><$properties $tiddler=Properties><$node $tiddler=N />");
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({N: {value: "good"}});
});

it("can change properties from a tiddler", async function() {
	wiki.addTiddler({title: "Properties", type: "application/json", text: JSON.stringify({value: "old"})});
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, "<$graph><$properties $for=edges $tiddler=Properties><$edge $from=A $to=B/><$node $tiddler=A /><$node $tiddler=B/>");
	var objects = init.calls.first().args[1];
	var edgeId = Object.keys(objects.edges)[0];
	expect(objects.edges[edgeId]).toEqual({from: "A", to: "B", value: "old"});
	// Now change the file
	wiki.addTiddler({title: "Properties", type: "application/json", text: JSON.stringify({value: "new"})});
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalledTimes(1);
	objects = update.calls.first().args[0];
	expect(objects.edges).toEqual({[edgeId]: {from: "A", to: "B", value: "new"}});
});

it("can switch dataTiddlers from a tiddler", async function() {
	wiki.addTiddler({title: "Properties1", type: "application/json", text: JSON.stringify({value: "old"})});
	wiki.addTiddler({title: "Properties2", type: "application/json", text: JSON.stringify({value: "new"})});
	wiki.addTiddler({title: "Target", text: "Properties1"});
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, "<$graph><$properties $for=edges $tiddler={{Target}}><$edge $from=A $to=B/><$node $tiddler=A /><$node $tiddler=B/>");
	var objects = init.calls.first().args[1];
	var edgeId = Object.keys(objects.edges)[0];
	expect(objects.edges[edgeId]).toEqual({from: "A", to: "B", value: "old"});
	// Now change the file
	wiki.addTiddler({title: "Target", text: "Properties2"});
	await $tw.test.flushChanges();
	expect(update).toHaveBeenCalledTimes(1);
	objects = update.calls.first().args[0];
	expect(objects.edges).toEqual({[edgeId]: {from: "A", to: "B", value: "new"}});
});

/*** $field attribute ***/

it("can load properties from a dataTiddler's field", function() {
	wiki.addTiddler({title: "Properties", type: "application/json", text: '{"value": "bad"}', field: '{"value": "good"}'});
	var widget = $tw.test.renderText(wiki, "<$graph><$properties $tiddler=Properties $field=field><$node $tiddler=N />");
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({N: {value: "good"}});
});

it("can ignore corrupt field properties", function() {
	wiki.addTiddler({title: "Properties", field: '{"corrupt"'});
	var widget = $tw.test.renderText(wiki, "<$graph><$properties $tiddler=Properties $field=field><$node $tiddler=N />");
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({N: {}});
});

it("loads from currentTiddler when $field specified", async function() {
	wiki.addTiddler({title: "Properties", field: '{"value": "first"}'});
	var widget = $tw.test.renderText(wiki, "\\define currentTiddler() Properties\n<$graph><$properties $field=field><$node $tiddler=N />");
	var objects = init.calls.first().args[1];
	expect(objects.nodes).toEqual({N: {value: "first"}});
	wiki.addTiddler({title: "Properties", field: '{"value": "second"}'});
	await $tw.test.flushChanges();
	objects = update.calls.first().args[0];
	expect(objects.nodes).toEqual({N: {value: "second"}});
});

// TODO: Missing tiddler when taking from a field

// TODO: When $properties $for=graph changes, minimize the amount of changing

});
