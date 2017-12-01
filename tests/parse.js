const 	$xmlParser = require('./../xml_parser');

var tests = [
	{
		markup: 
		`<div class="line properties_description">
			<p class="property semibold">Description :</p>
			<p class="value" itemprop="description">lumineux 2 pièces rénové, esprit loft, cuisine équipée, belle sdb avec baignore et wc suspendu, seche serviette programmable, 2ème étage, parking privatif, plein sud, residence calme, tous commerces à proximité, arret de bus devant residence, gare sncf 10mn à pied, centre ville 15mn <br>libre 1er septembre</p>
			
		</div>`,
		job: function(markup){
			var doc = $xmlParser.parseDocument(markup, {isHtml: true});
			var nodes = doc.querySelectorAll('.properties_description > [itemprop="description"]');

			console.log('Founded: %s', nodes.length);
			console.dir(nodes[0] && nodes[0].getTextContent());
		}
	},
	{
		markup: 'lumineux 2 pièces rénové, esprit loft, cuisine équipée, belle sdb avec baignore et wc suspendu, seche serviette programmable, 2ème étage, parking privatif, plein sud, residence calme, tous commerces à proximité, arret de bus devant residence, gare sncf 10mn à pied, centre ville 15mn ',
		job: function(markup){
			console.log(markup);
		}
	}
];

tests.forEach(function(test, i){
	console.log('Test %s', i);
	test.job(test.markup);
});