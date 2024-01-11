const 	$xmlParser = require('./../xml_parser');
const fs = require('fs');
const {DocumentBuilder} = $xmlParser;
var tests = [
	{
		markup: 
		`<div class="line properties_description">
			<p class="property semibold">Description :</p>
			<p class="value" itemprop="description">lumineux 2 pièces rénové, esprit loft, cuisine équipée, belle sdb avec baignore et wc suspendu, seche serviette programmable, 2ème étage, parking privatif, plein sud, residence calme, tous commerces à proximité, arret de bus devant residence, gare sncf 10mn à pied, centre ville 15mn <br>libre 1er septembre</p>
			
		</div>`,
		job: function(markup){
			var doc = $xmlParser.DocumentBuilder.parse(markup, {parseHtml: true});
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
	},
	{
		markup: 
		`1234<br/>abc
		<br><br>zxc<i>@</i><br>123`,
		job: function(markup){
			var doc2 = $xmlParser.DocumentBuilder.parse(markup, {parseHtml: true});
			console.log('`%s`', doc2.getTextContent());
			console.dir(doc2.childNodes.map((node) => node instanceof $xmlParser.NodeElement ? node.getTextContent() : node.textContent));
		}
	},
	{
		file: '../samples/archives.html', 
		job: function(markup) {
			const $doc = DocumentBuilder.parse(markup, {parseHtml:true});
			// Get all links to a non-parent page
			const nodes1 = $doc.querySelectorAll('[href%=\\.\\.]');
			const nodes2 = $doc.querySelectorAll('[href%=".."]');
			// Get all     links to archives
			const nodes3 = $doc.querySelectorAll('[href*=\\.zip]');
			
			let i = nodes1.length;
			console.log('Matches %s', i);
			// while(i-->0) {
			//     console.log('#%s %s', i, nodes[i].getAttribute('href'));
			// }
		}
	},
];

tests.forEach(function(test, i){
	console.log('[Test %s]', i);
	if (test.hasOwnProperty('markup')) return test.job(test.markup);
	if (test.hasOwnProperty('file')) {
		fs.readFile(test.file, 'utf8', function(err, html_code) {
			if (err) throw err;
			test.job(html_code);
		});
	}
});