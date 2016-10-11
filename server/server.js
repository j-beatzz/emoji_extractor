'use strict';

const http  = require('http');
const emojiJsonBuilder = require('./emojiJsonBuilder.js')


const PORT = 4040;

function handleRequest(request, response){
	if (request.url !== '/build-emoji-json' || request.method !== 'POST'){
		response.writeHead(201, {
			"Content-Type": "text/plain",
			"Access-Control-Allow-Origin": "*"
		});

		response.end();

		console.log(`INFO ${Date.now()} ${request.url} ${201} Bad Request tho`);
	}

	console.log('Now saving emoji JSON (pretty printed and minified).');

	getBody(request).then((data) => {
		emojiJsonBuilder.doAll(data, (status, error) => {
			if (!status) console.log(error);

			response.writeHead(201, {
				"Content-Type": "text/plain",
				"Access-Control-Allow-Origin": "*"
			});

			response.end();

			Promise.resolve().then(() => {
				emojiJsonBuilder.sort();
			});

			console.log(`INFO ${Date.now()} ${request.url} ${201} GOOD`);
		});
	});
}

function getBody(request){
	return new Promise((resolve) => {
		let body = [];

		request.on('data', (chunk) => {
			body.push(chunk);
		}).on('end', () => {
			body = Buffer.concat(body).toString();
			resolve(body);
		});
	});
}


const src = process.argv[2];

if (src == 'local'){
	emojiJsonBuilder.sortLocal();
} else {
	const server = http.createServer(handleRequest);
	server.listen(PORT, () => {
		console.log(`Server listening on http://localhost:${PORT}.`);
		console.log(`${Date.now()}`);
	});
}

