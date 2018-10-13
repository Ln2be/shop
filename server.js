const express = require('express')
const path = require('path')

const products = require('./routes/products')
const transactions = require('./routes/transactions')

const lq_products = require('./routes/lq_products')
const clients = require('./routes/clients')


const bodyParser = require('body-parser')


const app = express();

app.use(bodyParser.json({limit: '50mb', extended: true}))

app.use(express.static(path.join(__dirname, 'dist/shopNg')))

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
   next();
  });

//Api products

app.get('/api/products', products)

app.get('/api/products/:name', products)

app.delete('/api/products/:id', products)

app.post('/api/products', products)

app.post('/api/products/:id', products)

app.put('/api/products/:id', products)

//Api transactions

app.get('/api/transactions', transactions)

app.get('/api/transactions/:id', transactions)

app.delete('/api/transactions/:id', transactions)

app.post('/api/transactions', transactions)

app.post('/api/transactions/:id', transactions)

app.put('/api/transactions/:id', transactions)

//Api for low quantity products "lq_products"

app.get('/api/lq_products', lq_products)

//Api for low quantity products "lq_products"

app.get('/api/clients', clients)



app.listen(3000, (req, res) => {
    console.log('Running')
})