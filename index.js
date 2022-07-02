const express = require('express');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Check
app.get(`/check`, (req, res, next) => {
	res.send('Server is running');
});
// Get
app.get(`/:token/:key`, (req, res, next) => {
	if (fs.existsSync(path.join(__dirname + `/${req.params.token}/${req.params.key}.txt`))) {
		res.sendFile(path.join(__dirname + `/${req.params.token}/${req.params.key}.txt`));
	} else {
		res.status(404); // Not Found
		res.send('');
	}
});
// List
app.get(`/:token`, (req, res, next) => {
	if (fs.existsSync(path.join(__dirname + `/${req.params.token}`))) {
		res.setHeader('content-type', 'text/plain')
		res.send(fs.readdirSync(path.join(__dirname + `/${req.params.token}`), { withFileTypes: true }).filter(file => !file.isDirectory()).map(file => file.name.replace('.txt', '')).join('\n'));
	} else {
		res.status(404); // Not Found
		res.send('');
	}
});
// Set
app.post(`/:token`, (req, res, next) => {
	// TODO (req.body)
	if (fs.existsSync(path.join(__dirname + `/${req.params.token}`)))
		fs.mkdirSync(__dirname + `/${req.params.token}`, { recursive: true });
	let status = 400;
	let keys = Object.keys(req.body);
	for (let i = 0; i < keys.length; i++) {
		fs.writeFileSync(path.join(__dirname + `/${req.params.token}/${keys[i]}.txt`), req.body[keys[i]]);
		status = 204; // No Content
	}
	res.status(status);
	res.send('');
});
// Delete
app.delete(`/:token/:key`, (req, res, next) => {
	let status = 404;
	if (fs.existsSync(path.join(__dirname + `/${req.params.token}/${req.params.key}.txt`))) {
		fs.rmSync(path.join(__dirname + `/${req.params.token}/${req.params.key}.txt`), { force: true });
		status = 204;
	}
	res.status(status);
	res.send('');
});
app.use('/', (req, res, next) => {
	res.status(404); // Unknown route
	res.send('Unknown route');
});

app.listen(1337);
console.log('Server listening on port 1337');
