const express = require('express')
const router = express.Router()

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/mydbEl', { useNewUrlParser: true   });

const Lq_product = mongoose.model('lq_products', { name: String, quantity: Number});


// Send all lq_products
router.get('/api/lq_products', (req, res) => {
    Lq_product.find((err, rlq_product) => {
        res.send(rlq_product)
    })
})

module.exports = router;

