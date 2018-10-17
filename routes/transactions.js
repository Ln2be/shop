const express = require('express')
const router = express.Router()

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

//Create Connections to mongo
var conn = mongoose.createConnection('mongodb://localhost/mydbHim');
var conn2 = mongoose.createConnection('mongodb://localhost/mydbHim');

var conn3 = mongoose.createConnection('mongodb://localhost/mydbHim');
var conn4 = mongoose.createConnection('mongodb://localhost/mydbHim');

var conn5 = mongoose.createConnection('mongodb://localhost/mydbHim');


const TransactionM = conn2.model('transactions', { id:Number , clientPhone: String,
    product: [{
    name:String,
    quantity: Number,
    s_price:Number,
    totals: Number
}],
total:Number,
date :Date
 });

 //load products collection
const ProductM = conn.model('products', { name: String, price: Number, s_price: Number, quantity: Number});

//counters collerction

const schema = new Schema({ _id: String, seq: Number})


const CounterM = conn5.model('counters', schema);


CounterM.findOne({_id:"userid"}, (counter, err)=>{
if(!counter){
    
    const counter = new CounterM({
        _id: "userid",
        seq:0
    })

    counter.save((err) => {})
}
})

inc = function(name){
      return  CounterM.findByIdAndUpdate({_id:name}, {$inc: {seq: 1}}, {new:true})
}

var query = inc("userid");

//load low quantity products
const Lq_productM = conn3.model('lq_products', { name: String, quantity: Number});

//Define a schema for clients
const clientSchema = mongoose.Schema(
    { phone: Number,
        transaction: [{ id:String , clientPhone: String,
            product: [{
            name:String,
            quantity: Number
        }]
         }]
    }
)

//Load clients
const ClientM = conn4.model('clients', clientSchema);

//

// Send all transactions
router.get('/api/transactions', (req, res) => {
    TransactionM.find((err, rtransaction) => {
        res.send(rtransaction)
    })
})

//Send the requested post
router.get('/api/transactions/:id', (req, res) => {

    var id = req.param("id")
    TransactionM.findOne({id:id}, (err, rtransaction) => {
        res.send(rtransaction)
    })
})


//Delete the post
router.delete('/api/transactions/:id', (req, res) => {

    id = req.param("id");

    //Another way of doing it

    //Get the transaction
    pTransaction = TransactionM.findOne({id:id}).exec();

    var promises =[];

    //Search for all the products and update them
    pTransaction.then((transaction)=>{

        rtransaction = transaction;
        console.log(rtransaction)
        //Update the products after deleting the transaction (rProduct : returned product)
        //(sProduct : existed product in the stock)
        for(let rProduct of transaction.product){
                
            promises.push(ProductM.findOne({name:rProduct.name}).exec((err, sProduct)=>{

            
                //Save the quantity to update low quantity products
                quantity = sProduct.quantity

                //Update the product quantity and save it
                sProduct.quantity = sProduct.quantity + rProduct.quantity;
                sProduct.save();

                //Condition to remove low quantity product
                needRemove = quantity<100 && sProduct.quantity > 100;
                if(needRemove){
                    Lq_productM.findOneAndDelete({name:sProduct.name}).exec();
                }

                //Condition to update low quantity product
                needUpdate = quantity < 100 && sProduct.quantity < 100
                if(needUpdate){
                    Lq_productM.findOne({name:sProduct.name}).exec((err, lqproduct)=>{
                        lqproduct.quantity = sProduct.quantity
                    })
                }

            }))          
        }

        // Remove the transaction from client history of transactions
        phone = transaction.clientPhone;
        promises.push(
            //Find the client history
            ClientM.findOne({phone:phone}).exec().then(
                (client)=>{
                    client.transaction.forEach(
                        (cTransaction, index ,cTransactions)=>{
                            if(cTransaction._id == transaction._id){
                                cTransactions.splice(index, 1)
                            }
                        }
                    )
                }
            )
        )
    })

    //Delete the transaction after finishing updating the products
    Promise.all(promises).then((results)=>{

        TransactionM.findOneAndDelete({id:id}).exec().then(
            (tr)=>{
                res.send(tr)
            }
        )
    })
})

//Add a post
router.post('/api/transactions', (req, res) => {

    //The transaction we're preparing to send
    let newTransactionM = new TransactionM();

    //Create pseudo transaction to hold error in the products
    var erTransaction = {
        product: []
    }

    
    var promises = []

    //Demanded products
    var dProducts = req.body.product;
    
    //Search for all the products in the database 
    for(dProduct of dProducts) {
        
        promises.push(
            ProductM.findOne({name:dProduct.name}).exec()
        )
    }


    //Track transaction readiness
    var TransactionReady = true;

    //Test if transaction is ready for submitting
    var promise = Promise.all(promises).then((eProducts)=>{
        
        eProducts.forEach((eProduct, index, eProducts)=>{

            //Test if some products doent exist and send them to user 
            if(!eProduct){

                TransactionReady = false;

                erTransaction.product.push(
                    {
                        name:dProducts[index].name,
                        quantity: "-"
                    }
                )
            }else

            //Test if some products is not suffisant for the demanded quantity
            if(eProduct.quantity < dProducts[index].quantity){

                TransactionReady = false

                erTransaction.product.push(
                    {
                        name:dProducts[index].name,
                        quantity:eProduct.quantity
                    }
                )

            } 
        })

        if(!TransactionReady) res.send(erTransaction)
    },
    (reason)=>{
        console.log(reason)
    })

    //Update product if the transaction is ready and save it
    promise.then(()=>{
        if(TransactionReady){

            //Update the products after the transaction
            Promise.all(promises).then(
                (eProducts)=>{
                    eProducts.forEach(
                        (eProduct,i)=>{
    
                            //Save the product quantity for updating low quantity products
                            quantity = eProduct.quantity
    
                            //Update the product quantity
                            eProduct.quantity = eProduct.quantity - dProducts[i].quantity
    
                            eProduct.save()
    
                            //Check if we have to update low quantity product
    
                            needUpdate = quantity < 100 || eProduct.quantity < 100;
    
                            if(needUpdate){
    
                                updateLQProduct(eProduct)
                            }
                        }
                    )
                }
            )
    
            //Update client
            updateClient(req.body.clientPhone, req.body)
    
            //save the transaction
            query.exec((err, count)=>{
                newTransactionM.id = count.seq;
    
    
                newTransactionM.set(req.body)
                newTransactionM.date = Date.now();
    
    
                newTransactionM.save((err, transaction)=>{
                    res.send(transaction)
                })
            })
    
    
        }
    })

})

//Update a product from another product (uFProduct : update from product)
updateProduct = function(product, uFProduct){

    //Update the product quantity
    product.name = uFProduct.name 
    product.quantity = product.quantity - uPFroduct.quantity;
    product.save((err) => {
        if(err) console.log(err)
    })
}

updateLQProduct = function(product){

    Lq_productM.findOne({name:product.name}).exec((err, result) => {

        if(!result) result = new Lq_productM() 

        result.name = product.name
        result.quantity = product.quantity;

        result.save()
    })
}

updateClient = function(phone, transaction){

    ClientM.findOne({phone:phone}).exec((err, result) => {

        if(!result) result = new ClientM({
            phone:phone
        })

        result.transaction.push(transaction)

        result.save()
    })
}

module.exports = router;