/*\

Tests that the engines tw5-graph uses comply with what it expects,
at least for a subset of common actions.

\*/

var adapters = $tw.modules.getModulesByTypeAsHashmap("graphengine");

var Test = adapters.Test;

var doNotTestTheseAdapters = ["Test", "Also", "Orb"];

$tw.utils.each(adapters, function(adapter, name) {

if (doNotTestTheseAdapters.indexOf(name) >= 0) {
	// We don't test this one. Probably because it's already meant for testing.
	return;
}

describe(name + ' Adapter', function() {

it("matches the basic subset of actions", function() {
	for (var category in Test.properties) {
		var properties = adapter.properties[category];
		expect(properties).not.toBeUndefined(category);
		$tw.utils.each(Test.properties[category], function(property, name) {
			if (property.type === "actions") {
				var adapterProperty = properties[name];
				var blurb = category+"##"+name;
				expect(adapterProperty).not.toBeUndefined(blurb);
				if (adapterProperty) {
					expect(adapterProperty.variables || []).withContext(blurb).toEqual(property.variables || []);
				}
			}
		});
	}
});

});

});
