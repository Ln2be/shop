const express = require('express')
const router = express.Router()

const mongoose = require('mongoose');

var conn = mongoose.createConnection('mongodb://localhost/mydbAli');
var conn2 = mongoose.createConnection('mongodb://localhost/mydbAli');

const ProductM = conn.model('products', { name: String, price: Number, s_price: Number, quantity: Number});

const Lq_productM = conn2.model('lq_products', { name: String, quantity: Number});


// Send all products
router.get('/api/products', (req, res) => {
    ProductM.find((err, rproduct) => {
        res.send(rproduct)
    })
})


//Send the requested post
router.get('/api/products/:name', (req, res) => {

    var name = req.param("name")

    ProductM.findOne({name:name}, (err, rproduct) => {
        console.log(rproduct)
            res.send(rproduct)
        
    })
})

//Delete the post
router.delete('/api/products/:id', (req, res) => {

    var name = req.param("id")

    ProductM.findOneAndDelete({name:name}, (err, rproduct) => {
        res.send(rproduct)
    })
})


//Add a post
router.post('/api/products', (req, res) => {

        //Itrate through products, save transactions, update products and low quantity 
    //products if necessary

    var productLength = req.body.length;
    for(var i=0; i<productLength; i++) {
        
    //Get the product properties
    let productReq = req.body[i]
    let p_name = req.body[i].name;
    let p_quantity = req.body[i].quantity


    ProductM.findOne({name:p_name}).exec((err, product) => {
        if(product)
        {
            quantity = product.quantity;

            //Update the product quantity 
            product.quantity = product.quantity + +p_quantity;
            product.save((err) => {
                if(err) console.log(err)
            })

            if(quantity<100 && product.quantity>=100){
                Lq_productM.findOneAndDelete({name:product.name}, (err, lq_product) => {

                })
            }
        }
        else{


            const newProductM = new ProductM(productReq);
            newProductM.save().then(() => {
            })

            if(p_quantity<100){

                var lqp = new Lq_productM({
                    name: p_name,
                    quantity: p_quantity
                })

                lqp.save((err) => {
                   if(err) console.log(err)
                })
            }

        }
    })

    }

    res.send(req.body)

})

//Update the post
router.put('/api/products/:id', (req, res) => {

    const newProductM = new ProductM(req.body);
    var id = mongoose.Types.ObjectId(req.param("id"));

   ProductM.findByIdAndUpdate(id, {$set: req.body}, () => {
       res.send(newProductM)
   })
})


module.exports = router;