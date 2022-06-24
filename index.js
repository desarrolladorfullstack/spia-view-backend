const express = require('express');
const app = express();
const port = 3010;
const path = require('path');
var bodyParser = require('body-parser');

app.use(express.static('static'));
app.use(express.json());
app.use(bodyParser.text());

app.get('/home', (req, res) => {
  console.log("get /");
  res.sendFile(path.resolve('pages/index.html'));
});

app.post('/', (req, res) => {
  console.log("post /", req.body);
  res.send(req.body);
});

app.listen(port, () => {
  console.log(`Example app listening at port :${port}`);
});
