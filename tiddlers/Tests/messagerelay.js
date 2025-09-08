/*\

Tests the messagerelay widget.

\*/

describe('MessageRelayWidget', function() {

var wiki, actionMethod;

beforeEach(function() {
	wiki = new $tw.Wiki();
	$tw.test.setSpies();
	actionMethod = spyOn($tw.test, "actionMethod");
	var oldCreate = $tw.fakeDocument.createElement;
	spyOn($tw.fakeDocument, "createElement").and.callFake(function(tag) {
		var element = oldCreate(tag);
		$tw.utils.extend(element, $tw.test.mock.EventTarget.prototype);
		return element;
	});
});

function triggerChildren(widget, targetClass) {
	for (var i = 0; i < widget.children.length; i++) {
		var child = widget.children[i];
		if (child.class === targetClass) {
			child.domNode.dispatchEvent({type: "click"});
		}
		triggerChildren(child, targetClass);
	}
};

it("transmits to matched relay points only", function() {
	var widget = $tw.test.renderText(wiki, `<$messagerelay to=yes>
	  <$button class=target actions='<$action-sendmessage $message=tm-test />'/>
	</$messagerelay>
	<$messagecatcher $tm-test='<$action-test value=yes />'>
	  <$messagerelay name=yes/>
	</$messagecatcher>
	<$messagecatcher $tm-test='<$action-test value=also />'>
	  <$messagerelay name=yes/>
	</$messagecatcher>
	<$messagecatcher $tm-test='<$action-test value=no />'>
	  <$messagerelay name=no/>
	</$messagecatcher>`);
	triggerChildren(widget, "target");
	expect(actionMethod).toHaveBeenCalledWith({value: "yes"});
	expect(actionMethod).toHaveBeenCalledWith({value: "also"});
	expect(actionMethod).not.toHaveBeenCalledWith({value: "no"});
});

it("handles no receiver", function() {
	expect(function() {
		var widget = $tw.test.renderText(wiki, `<$messagerelay to=yes>
		  <$button class=target actions='<$action-sendmessage $message=tm-test />'/>`);
		triggerChildren(widget, "target");
	}).not.toThrow();
});

xit("ignores removed relays", async function() {
	wiki.addTiddler({title: "List", list: "A B"});
	var widget = $tw.test.renderText(wiki, `<$messagerelay to=target>
	  <$button class=target actions='<$action-sendmessage $message=tm-test />'/>
	</$messagerelay>
	<$list filter="[list[List]]">
	  <$messagecatcher $tm-test='<$action-test tiddler={{!!title}} />'>
	    <$messagerelay name=target>`);
	wiki.addTiddler({title: "List", list: "A"});
	await $tw.test.flushChanges();
	triggerChildren(widget, "target");
	expect(actionMethod).toHaveBeenCalledTimes(1);
	expect(actionMethod).toHaveBeenCalledWith({tiddler: "A"});
	expect(actionMethod).not.toHaveBeenCalledWith({tiddler: "B"});
});

/*** Infinite loops ***/

it("does not infinite loop", function() {
	var widget = $tw.test.renderText(wiki, `<$messagerelay to=yes>
	  <$button class=target actions='<$action-sendmessage $message=tm-test />'/>
	  <$messagecatcher $tm-test='<$action-test value=yes />'>
	    <$messagerelay name=yes/>
	  </$messagecatcher>
	  <$messagerelay name=yes/>
	</$messagerelay>`);
	triggerChildren(widget, "target");
	expect(actionMethod).toHaveBeenCalledWith({value: "yes"});
});

it("handles double-step infinite loop (a figure eight)", function() {
	var widget = $tw.test.renderText(wiki, `<$messagerelay to=second>
	  <$button class=target actions='<$action-sendmessage $message=tm-test />'/>
	  <$messagecatcher $tm-test='<$action-test value=yes />'>
	    <$messagerelay name=first/>
	  </$messagecatcher>
	  <$messagerelay name=first/>
	</$messagerelay>
	<$messagerelay to=first><$messagerelay name=second/></$messagerelay>`);
	triggerChildren(widget, "target");
	expect(actionMethod).toHaveBeenCalledWith({value: "yes"});
});

// TODO: This only passes because messagecatcher has its own infinite loop failsafes.
it("handles double-step infinite loop (alternating messages)", function() {
	var widget = $tw.test.renderText(wiki, `<$messagerelay to=second>
	  <$button class=target actions='<$action-sendmessage $message=tm-test />'/>
	  <$messagecatcher $tm-test='<$action-test value=first />'>
	    <$messagerelay name=first/>
	  </$messagecatcher>
	  <$messagerelay name=first/>
	</$messagerelay>
	<$messagerelay to=first>
	  <$messagecatcher $tm-test='<$action-sendmessage $message=tm-test />'>
	    <$messagerelay name=second/>
	  </$messagecatcher>
	</$messagerelay>`);
	triggerChildren(widget, "target");
	expect(actionMethod).toHaveBeenCalledTimes(1);
	expect(actionMethod).toHaveBeenCalledWith({value: "first"});
});

});
