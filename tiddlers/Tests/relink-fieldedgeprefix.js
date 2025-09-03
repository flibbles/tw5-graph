/*\

Tests relinking of field edge names in $:/config/flibbles/graph/edges/fields/...

\*/

describe("Relink fieldEdge prefix", function() {

var language = require('$:/plugins/flibbles/relink/js/language.js');
// A common title for a graph properties tiddler
var dictType = "application/x-tiddler-dictionary";

var wiki, log, failures;
var engineConfig = "$:/config/flibbles/graph/engine";
var blacklist = "$:/config/flibbles/relink/fieldnames/blacklist";

var prefix = "$:/config/flibbles/graph/edges/fields/";
var fromTitle = "$:/config/flibbles/graph/edges/fields/from";
var toTitle = "$:/config/flibbles/graph/edges/fields/to";

beforeEach(function() {
	wiki = new $tw.Wiki();
	wiki.addTiddler({title: engineConfig, text: "Test"});
    wiki.addTiddler({title: blacklist, filter: "text title type"});
	log = spyOn(console, "log");
	failures = spyOn(language, "reportFailures");
});

it("reports and relinks field edge property files", function() {
	wiki.addTiddler({ title: fromTitle, type: dictType, text: "physics: yes"});
	var report = wiki.getTiddlerRelinkReferences(fromTitle);
	expect(report).toEqual({"from": ["#graph field edgetype: from"]});
	wiki.renameTiddler("from", "to");
	expect(wiki.tiddlerExists(toTitle)).toBe(true);
	expect(wiki.tiddlerExists(fromTitle)).toBe(false);
	expect(wiki.getTiddlerData(toTitle)).toEqual({physics: "yes"});
});

it("can relink both title and data of property file", function() {
	wiki.addTiddler({ title: fromTitle, type: dictType, text: "delete: {{from}}"});
	var report = wiki.getTiddlerRelinkReferences(fromTitle);
	expect(report).toEqual({"from": ["delete: {{}}", "#graph field edgetype: from"]});
	wiki.renameTiddler("from", "to");
	expect(wiki.tiddlerExists(toTitle)).toBe(true);
	expect(wiki.tiddlerExists(fromTitle)).toBe(false);
	expect(wiki.getTiddlerData(toTitle)).toEqual({"delete": "{{to}}"});
});

it("Ignores reserved fromTitles", function() {
	wiki.addTiddler({ title: prefix + "type", type: dictType, text: "physics: yes"});
	wiki.renameTiddler("type", "to");
	expect(wiki.tiddlerExists(prefix + "type")).toBe(true);
	expect(wiki.tiddlerExists(toTitle)).toBe(false);
	expect(log).not.toHaveBeenCalled();
	expect(failures).not.toHaveBeenCalled();
});

it("Aborts renaming to reserved toTitles", function() {
	wiki.addTiddler({ title: fromTitle, type: dictType, text: "physics: yes"});
	wiki.renameTiddler("from", "type");
	expect(wiki.tiddlerExists(fromTitle)).toBe(true);
	expect(wiki.tiddlerExists(prefix + "type")).toBe(false);
	expect(log).not.toHaveBeenCalled();
	expect(failures).toHaveBeenCalledTimes(1);
});

it("Aborts clobbering already existing field configs", function() {
	wiki.addTiddler({ title: fromTitle, type: dictType, text: "physics: yes"});
	wiki.addTiddler({ title: toTitle, type: dictType, text: "physics: no"});
	wiki.renameTiddler("from", "to");
	expect(wiki.tiddlerExists(fromTitle)).toBe(true);
	expect(wiki.tiddlerExists(toTitle)).toBe(true);
	expect(log).not.toHaveBeenCalled();
	expect(failures).toHaveBeenCalledTimes(1);
	expect(wiki.getTiddlerData(toTitle)).toEqual({physics: "no"});
});

});
