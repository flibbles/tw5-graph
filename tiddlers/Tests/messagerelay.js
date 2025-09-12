/*\

Tests the messagerelay widget.

\*/

describe('MessageRelayWidget', function() {

var wiki, actionMethod, register;

var oldRootWidget;

beforeAll(function() {
	oldRootWidget = $tw.rootWidget;
});

afterEach(function() {
	$tw.rootWidget = oldRootWidget;
});

beforeEach(function() {
	wiki = new $tw.Wiki();
	({register} = $tw.test.setSpies());
	actionMethod = spyOn($tw.test, "actionMethod");
	var oldCreate = $tw.fakeDocument.createElement;
	spyOn($tw.fakeDocument, "createElement").and.callFake(function(tag) {
		var element = oldCreate(tag);
		$tw.utils.extend(element, $tw.test.mock.EventTarget.prototype);
		return element;
	});
	$tw.rootWidget = wiki.makeWidget();
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
	</$messagecatcher>`, {parentWidget: $tw.rootWidget});
	$tw.rootWidget.children = [widget];
	triggerChildren(widget, "target");
	expect(actionMethod).toHaveBeenCalledWith({value: "yes"});
	expect(actionMethod).toHaveBeenCalledWith({value: "also"});
	expect(actionMethod).not.toHaveBeenCalledWith({value: "no"});
});

it("copes with the rootWidget being disconnected at startup", function() {
	var widget = $tw.test.renderText(wiki, `\\whitespace trim
	<$messagerelay to=yes>
	  <$button class=target actions='<$action-sendmessage $message=tm-test />'/>
	</$messagerelay>
	<$messagecatcher $tm-test='<$action-test value=yes />'>
	  <$messagerelay name=yes/>
	</$messagecatcher>`, {parentWidget: $tw.rootWidget});
	// Now that the relays are made, we connect the root to the page.
	$tw.rootWidget.children = [widget];
	triggerChildren(widget, "target");
	expect(actionMethod).toHaveBeenCalledWith({value: "yes"});
});

it("handles no receivers", function() {
	expect(function() {
		var widget = $tw.test.renderText(wiki, `<$messagerelay to=yes>
		  <$button class=target actions='<$action-sendmessage $message=tm-test />'/>`, {parentWidget: $tw.rootWidget});
		$tw.rootWidget.children = [widget];
		triggerChildren(widget, "target");
	}).not.toThrow();
});

it("handles no matching receivers", function() {
	expect(function() {
		var widget = $tw.test.renderText(wiki, `<$messagerelay name=mismatch/>
		<$messagerelay to=yes>
		  <$button class=target actions='<$action-sendmessage $message=tm-test />'/>`, {parentWidget: $tw.rootWidget});
		$tw.rootWidget.children = [widget];
		triggerChildren(widget, "target");
	}).not.toThrow();
});

/*** Removal and readjusting ***/

it("ignores removed relays", async function() {
	wiki.addTiddler({title: "List", list: "A B"});
	var widget = $tw.test.renderText(wiki, `\\whitespace trim
	<$messagerelay to=target>
	  <$button class=target actions='<$action-sendmessage $message=tm-test />'/>
	</$messagerelay>
	<$list filter="[list[List]]">
	  <$messagecatcher $tm-test='<$action-test tiddler={{!!title}} />'>
	    <$messagerelay name=target />`, {parentWidget: $tw.rootWidget});
	$tw.rootWidget.children = [widget];
	wiki.addTiddler({title: "List", list: "A"});
	await $tw.test.flushChanges();
	triggerChildren(widget, "target");
	expect(actionMethod).toHaveBeenCalledTimes(1);
	expect(actionMethod).toHaveBeenCalledWith({tiddler: "A"});
	expect(actionMethod).not.toHaveBeenCalledWith({tiddler: "B"});
});

it("can redirect 'to' without a full refresh", async function () {
	wiki.addTiddler({title: "Name", text: "first"});
	var logWidget = $tw.modules.applyMethods("widget")["action-log"];
	var log = spyOn(logWidget.prototype, "log");
	// We spy on this too so the log doesn't auto-refresh and re-log anyway
	spyOn(logWidget.prototype, "refreshSelf");
	var widget = $tw.test.renderText(wiki, `\\whitespace trim
	<$messagerelay to={{Name}} >
	  <$button class=target actions='<$action-sendmessage $message=tm-test />'/>
	  <$log called=true />
	</$messagerelay>
	<$list filter="first second">
	  <$messagecatcher $tm-test='<$action-test name={{!!title}} />'>
	    <$messagerelay name={{!!title}} />`, {parentWidget: $tw.rootWidget});
	$tw.rootWidget.children = [widget];
	expect(log).toHaveBeenCalled();
	log.calls.reset();
	wiki.addTiddler({title: "Name", text: "second"});
	await $tw.test.flushChanges();
	// Now we call an event to hit that changed relayer
	triggerChildren(widget, "target");
	// It should have hit the relay corresponding to the updated name
	expect(actionMethod).toHaveBeenCalledTimes(1);
	expect(actionMethod).toHaveBeenCalledWith({name: "second"});
	// And we check to make sure the log widget wasn't recreated
	expect(log).not.toHaveBeenCalled();
});

it("properly unregisters old name when renamed", async function() {
	wiki.addTiddler({title: "Name", text: "first"});
	var widget = $tw.test.renderText(wiki, `\\whitespace trim
	<$list filter="first second">
	  <$messagerelay to={{!!title}} >
	    <$button class={{!!title}} actions='<$action-sendmessage $message=tm-test />'/>
	  </$messagerelay>
	</$list>
	<$messagecatcher $tm-test='<$action-test />'>
	  <$messagerelay name={{Name}} />`, {parentWidget: $tw.rootWidget});
	$tw.rootWidget.children = [widget];
	wiki.addTiddler({title: "Name", text: "second"});
	await $tw.test.flushChanges();
	// First we call the old name, and make sure it deregistered
	triggerChildren(widget, "first");
	expect(actionMethod).not.toHaveBeenCalled();
	// Now we call the new name, and make sure it DID register
	triggerChildren(widget, "second");
	expect(actionMethod).toHaveBeenCalledTimes(1);
});

// messagerelays must register for cleanup, because it's possible for them to
// detach from the widget tree, but never get a chance to clean up on their own
it("detects when to destroy itself", async function() {
	register.and.callThrough();
	wiki.addTiddler({title: "View", text: "yes"});
	var widget = $tw.test.renderText(wiki, "<%if [{View}!match[no]] %>\n\n<$messagerelay name=test />\n", {parentWidget: $tw.rootWidget});
	$tw.rootWidget.children = [widget];
	var relayWidget = widget;
	// Find the relay widget, which will be at the bottom of the widget stack
	while (relayWidget.children.length > 0) {
		relayWidget = relayWidget.children[0];
	}
	var destroy = spyOn(relayWidget, "destroy").and.callThrough();
	var check = spyOn(relayWidget, "isGarbage").and.callThrough();
	await $tw.test.flushChanges();
	expect(register).toHaveBeenCalled();
	$tw.test.utils.upkeep();
	expect(check).toHaveBeenCalled();
	expect(destroy).not.toHaveBeenCalled();
	// Now we put in a change that will remove it
	check.calls.reset();
	wiki.addTiddler({title: "View", text: "no"});
	await $tw.test.flushChanges();
	$tw.test.utils.upkeep();
	expect(check).toHaveBeenCalled();
	expect(destroy).toHaveBeenCalled();
});

/*** Infinite loops ***/

it("does not infinite loop", function() {
	var widget = $tw.test.renderText(wiki, `<$messagerelay to=yes>
	  <$button class=target actions='<$action-sendmessage $message=tm-test />'/>
	  <$messagecatcher $tm-test='<$action-test value=yes />'>
	    <$messagerelay name=yes/>
	  </$messagecatcher>
	  <$messagerelay name=yes/>
	</$messagerelay>`, {parentWidget: $tw.rootWidget});
	$tw.rootWidget.children = [widget];
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
	<$messagerelay to=first><$messagerelay name=second/></$messagerelay>`, {parentWidget: $tw.rootWidget});
	$tw.rootWidget.children = [widget];
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
	</$messagerelay>`, {parentWidget: $tw.rootWidget});
	$tw.rootWidget.children = [widget];
	triggerChildren(widget, "target");
	expect(actionMethod).toHaveBeenCalledTimes(1);
	expect(actionMethod).toHaveBeenCalledWith({value: "first"});
});

});
