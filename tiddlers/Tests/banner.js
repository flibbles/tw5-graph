/*\

Tests the boundingbox widget.

\*/

describe('Banner', function() {

var wiki, register, init, window;

beforeEach(async function() {
	wiki = new $tw.Wiki();
	({register, init, window} = $tw.test.setSpies());
	await $tw.test.setGlobals(wiki);
});

it("changes navigates to modals when in fullscreen mode", async function() {
	var createElement = $tw.fakeDocument.createElement;
	createElement: spyOn($tw.fakeDocument, "createElement").and.callFake(function() {
		var element = createElement.apply(this, arguments);
		// Defaults so that boundingbox can run without special handling
		element.getBoundingClientRect = () => ({top: 30, left: 30});
		return element;
	})
	wiki.addTiddlers([
		{title: "Main", template: "Template"},
		{title: "Template", text: "Butts Butts Butts\n\n<$graph><$node $tiddler=Target actions='<$action-navigate $to=Target/>'/>"}]);
	var text = "<$messagecatcher $tm-modal='<$action-test message=tm-modal/>' $tm-navigate='<$action-test message=tm-navigate/>'>\n\n<$transclude $tiddler='$:/plugins/flibbles/graph/ui/SideBar' graph=Main />\n";
	var widgetNode = $tw.test.renderGlobal(wiki, text);
	$tw.test.dispatchEvent(wiki, {type: "actions", objectType: "nodes", id: "Target"});
	expect($tw.test.actionMethod).toHaveBeenCalledTimes(1);
	expect($tw.test.actionMethod).toHaveBeenCalledWith({message: "tm-navigate"});
	$tw.test.actionMethod.calls.reset();
	wiki.addTiddler({title: "$:/state/flibbles/graph/fullscreen", text: "graph-fullscreen"});
	$tw.test.dispatchEvent(wiki, {type: "actions", objectType: "nodes", id: "Target"});
	expect($tw.test.actionMethod).toHaveBeenCalledTimes(1);
	expect($tw.test.actionMethod).toHaveBeenCalledWith({message: "tm-modal"});
});

});
