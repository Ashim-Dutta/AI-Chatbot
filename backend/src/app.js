const express = require('express');
const app = express();
const path = require('path')


// app.get('/', (req, res) => {
//   res.send('Hello World!');
// });

app.use(express.static(path.join(__dirname, '../public')))

app.get("*name", (req, res) => { 
  res.sendFile(path.join(__dirname,'../public/index.html'))
})

module.exports = app;