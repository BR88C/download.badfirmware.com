// Import modules.
const express = require(`express`);
const path = require(`path`);


const app = express();
app.set(`views`, path.resolve(__dirname, `../client/views`));
app.set(`view engine`, `ejs`);
app.listen(8080);
app.get(`/`, (req, res) => res.render(`index.ejs`));
app.use(express.static(path.resolve(__dirname, `../client/public`)));

console.log(`Webfront listening to port 8080.`)