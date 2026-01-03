/*\

Includes all the relink tests, but only if relink is currently available.

\*/

var TEST_FILTER = "[[$:/tags/relink-test-spec]tagging[]type[application/javascript]]";
var relinkTests = $tw.wiki.filterTiddlers(TEST_FILTER);

if (!$tw.wiki.tiddlerExists("$:/plugins/flibbles/relink")) {
	console.log("Relink plugin not found on TIDDLYWIKI_PLUGIN_PATH. Skipping all Relink related tests.");
} else {
	var context = {
		console: console,
		setInterval: setInterval,
		clearInterval: clearInterval,
		setTimeout: setTimeout,
		clearTimeout: clearTimeout,
		$tw: $tw,
		// This is cheaper than getting these values from the
		// jasmine interface, but it's late at night, and I'm lazy.
		expect: expect,
		spyOn: spyOn,
		describe: describe,
		xdescribe: xdescribe,
		it: it,
		xit: xit,
		beforeEach: beforeEach,
		beforeAll: beforeAll
	};
	$tw.utils.each(relinkTests, evalInContext);
}

function evalInContext(title) {
	var code = $tw.wiki.getTiddlerText(title, "");
	var _exports = {};
	context.exports = _exports;
	context.module = {exports: _exports};
	context.require = function(moduleTitle) {
		// mock out the 'glob' module required in
		// "$:/plugins/tiddlywiki/jasmine/jasmine/jasmine.js"
		if (moduleTitle === "glob") {
			return {};
		}
		return $tw.modules.execute(moduleTitle,title);
	};
	var contextExports = $tw.utils.evalSandboxed(code, context, title, true);
	// jasmine/jasmine.js assigns directly to `module.exports`: check
	// for it first.
	return context.module.exports || contextExports;
};
