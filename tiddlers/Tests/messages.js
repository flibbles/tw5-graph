/*\

Tests the message system of graphs.

\*/

describe("mesages", function() {

var wiki, init;

beforeEach(async function() {
	wiki = new $tw.Wiki();
	({init} = $tw.test.setSpies());
	await $tw.test.setGlobals(wiki);
});

/*** Bubbling ***/

it("can block bubbling", function() {
	var event = {objectType: "nodes", id: "target", type: "actions"};
	var text = "<$messagecatcher $graph-test='<$action-test caught=yes/>'><$graph><$node $tiddler=target actions='<$action-sendmessage $message=graph-test $param=false />' />";
	var widget = $tw.test.renderText(wiki, text);
	var method = spyOn($tw.test, "actionMethod");
	$tw.test.dispatchEvent(wiki, event);
	expect(method).toHaveBeenCalledTimes(1);
	expect(method.calls.first().args[0]).toBe("graph-test");
});

it("can specify further bubbling", function() {
	var event = {objectType: "nodes", id: "target", type: "actions"};
	var text = "<$messagecatcher $graph-test='<$action-test caught=yes/>'><$graph><$node $tiddler=target actions='<$action-sendmessage $message=graph-test $param=true />' />";
	var widget = $tw.test.renderText(wiki, text);
	var method = spyOn($tw.test, "actionMethod");
	$tw.test.dispatchEvent(wiki, event);
	expect(method).toHaveBeenCalledTimes(2);
	expect(method.calls.first().args[0]).toBe("graph-test");
});

it("by default allow further bubbling", function() {
	var event = {objectType: "nodes", id: "target", type: "actions"};
	var text = "<$messagecatcher $graph-test='<$action-test caught=yes/>'><$graph><$node $tiddler=target actions='<$action-sendmessage $message=graph-test />' />";
	var widget = $tw.test.renderText(wiki, text);
	var method = spyOn($tw.test, "actionMethod");
	$tw.test.dispatchEvent(wiki, event);
	expect(method).toHaveBeenCalledTimes(2);
	expect(method.calls.first().args[0]).toBe("graph-test");
	expect(method.calls.argsFor(1)).toEqual([{caught: "yes"}]);
});

it("do not stop unknown messages from bubbling", function() {
	var event = {objectType: "nodes", id: "target", type: "actions"};
	var text = "<$messagecatcher $graph-unknown='<$action-test caught=unknown/>'><$graph><$node $tiddler=target actions='<$action-sendmessage $message=graph-unknown />' />";
	var widget = $tw.test.renderText(wiki, text);
	var method = spyOn($tw.test, "actionMethod");
	$tw.test.dispatchEvent(wiki, event);
	expect(method).toHaveBeenCalledWith({caught: "unknown"});
});

// This allows for backward compatibility
it("do not need to exist in the engine", function() {
	var event = {objectType: "nodes", id: "target", type: "actions"};
	var text = "<$messagecatcher $graph-test='<$action-test caught=test/>'><$graph $engine=Also><$node $tiddler=target actions='<$action-sendmessage $message=graph-test $param=false />' />";
	var widget = $tw.test.renderText(wiki, text);
	var method = spyOn($tw.test, "actionMethod");
	$tw.test.dispatchEvent(wiki, event);
	expect(method).toHaveBeenCalledWith({caught: "test"});
});

/*** Parameters ***/

it("can convert declared parameters", function() {
	var event = {objectType: "nodes", id: "target", type: "actions"};
	var text = "<$graph><$node $tiddler=target actions='<$action-sendmessage $message=graph-test number=4 />' />";
	var widget = $tw.test.renderText(wiki, text);
	var method = spyOn($tw.test, "actionMethod");
	$tw.test.dispatchEvent(wiki, event);
	expect(method).toHaveBeenCalledWith("graph-test", {number: 4});
});

it("evaluates parameters using messageWidget context", function() {
	var event = {objectType: "nodes", id: "target", type: "actions"};
	var text = "\\procedure inner() inner wrong!\n\\procedure outer() outer wrong!\n<$graph><$vars outer=B><$node $tiddler=target actions='<$vars inner=C><$action-sendmessage $message=graph-test filterParam=\"A [<outer>] [<inner>]\" />' />";
	var widget = $tw.test.renderText(wiki, text);
	var method = spyOn($tw.test, "actionMethod");
	$tw.test.dispatchEvent(wiki, event);
	expect(method).toHaveBeenCalledWith("graph-test", {filterParam: ["A", "B", "C"]});
});

it("evaluated parameters update appropriately", async function() {
	var event = {objectType: "nodes", id: "target", type: "actions"};
	wiki.addTiddler({title: "Target", text: "first"});
	var text = "<$graph><$node $tiddler=target actions='<$action-sendmessage $message=graph-test filterParam=\"A [{Target}]\" />' />";
	await $tw.test.flushChanges();
	var widget = $tw.test.renderText(wiki, text);
	var method = spyOn($tw.test, "actionMethod");
	$tw.test.dispatchEvent(wiki, event);
	expect(method).toHaveBeenCalledWith("graph-test", {filterParam: ["A", "first"]});
	// Now we change the value and make sure the message has the new value
	method.calls.reset();
	wiki.addTiddler({title: "Target", text: "second"});
	await $tw.test.flushChanges();
	$tw.test.dispatchEvent(wiki, event);
	expect(method).toHaveBeenCalledWith("graph-test", {filterParam: ["A", "second"]});

});

it("undeclared parameters are passed as-is", function() {
	var event = {objectType: "nodes", id: "target", type: "actions"};
	var text = "<$graph><$node $tiddler=target actions='<$action-sendmessage $message=graph-test undeclared=25 />' />";
	var widget = $tw.test.renderText(wiki, text);
	var method = spyOn($tw.test, "actionMethod");
	$tw.test.dispatchEvent(wiki, event);
	expect(method).toHaveBeenCalledWith("graph-test", {undeclared: "25"});
});

});
