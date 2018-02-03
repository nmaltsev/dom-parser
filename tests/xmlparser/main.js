





var tests = [
	{
		selector: 'div',
		markup: `
			<body>
				<div>123</div>
				<div class="test">
					<div>abc</div>
				</div>
			</body>
		`
	}, {
		selector: 'div#id2',
		markup: `
			<body>
				<div>123</div>
				<div class="test" id="id2">
					<div>abc</div>
				</div>
			</body>
		`
	}, {
		selector: 'div.cls1.cls2',
		markup: `
			<body class="cls2">
				<div>123</div>
				<div class="test cls1" id="id2">
					<div class="cls3 cls1 cls2">abc</div>
				</div>
			</body>
		`
	}, {
		selector: '.cls3 > div.cls1.cls2[href]',
		markup: `
			<body class="cls3">
				<div>123</div>
				<div class="test cls1 cls2" id="id2" href>...</div>
			</body>
		`
	}, {
		selector: '.cls3 > .cls1',
		markup: `
			<body class="cls3">
				<div>123</div>
				<div class="test cls1" id="id2" href>...</div>
			</body>
		`
	}, {
		selector: 'table.test-table[target="_blank"] td > span:nth-child(2n+1)',
		markup: `
			<body class="cls3">
				<table class="test-table" target="_blank">
					<tbody>
						<tr>
							<td>
								<span>1</span>
								<span>2</span>
								<span>3</span>
								<span>4</span>
								<span>5</span>
								<span>6</span>
								<span>7</span>
							</td>
						</tr>
					</tbody>
				</table>
			</body>
		`
	}, {
		selector: 'table.test-table[target="_blank"] td > span:nth-child(n)',
		markup: `
			<body class="cls3">
				<table class="test-table" target="_blank">
					<tbody>
						<tr>
							<td>
								<span>1</span>
								<span>2</span>
								<span>3</span>
								<span>4</span>
								<span>5</span>
								<span>6</span>
								<span>7</span>
							</td>
						</tr>
					</tbody>
				</table>
			</body>
		`
	}
].forEach(function(item, i){
	console.group('Test #' + i + ' ' + item.selector);
	
	let selectorTree = SelectorService.parseQuery(item.selector);

	console.dir(selectorTree);

	if (item.markup) {
		var doc = DocumentBuilder.parse(item.markup, {isHtml: true});

		console.log('Document \n`%s`', item.markup);
		console.dir(doc);
		console.dir(doc.querySelectorAll(item.selector));
	} 


	console.groupEnd();
})