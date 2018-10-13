const express = require('express')
const router = express.Router()

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

//Create Connections to mongo
var conn = mongoose.createConnection('mongodb://localhost/mydbEl');
var conn2 = mongoose.createConnection('mongodb://localhost/mydbEl');

var conn3 = mongoose.createConnection('mongodb://localhost/mydbEl');
var conn4 = mongoose.createConnection('mongodb://localhost/mydbEl');

var conn5 = mongoose.createConnection('mongodb://localhost/mydbEl');




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
    console.log("Came")

    var id = req.param("id")
    TransactionM.findOne({id:id}, (err, rtransaction) => {
        res.send(rtransaction)
    })
})


//Delete the post
router.delete('/api/transactions/:id', (req, res) => {

    id = req.param("id");
    j=0;

    TransactionM.findOne({id:id}, (err, transaction) => {
        if(transaction){

             //Itrate through products, save transactions, update products and low quantity 
            //products if necessary
            var productLength = transaction.product.length;
            for(var i=0; i<productLength; i++) {
                
                //Update the product
                let p_name = transaction.product[i].name;
                let p_quantity = transaction.product[i].quantity


                ProductM.findOne({name:p_name}).exec((err, product) => {
                    if(product)
                    {
                        //Update the product
                        quantity = product.quantity;

                        product.quantity = product.quantity + p_quantity;
                        product.save((err) => {
                            if(err) console.log(err)
                        })

                        goOut = quantity<100 && product.quantity>=100
                        if(goOut){
                            Lq_productM.findOneAndDelete({name:product.name}, (err, lq_product) => {

                        })
                        }
                        else
                        {
                            remainInLQ = product.quantity<100
                            if(remainInLQ){

                                Lq_productM.findOne({name:product.name}).exec((err, lq_product) => {
                                    lq_product.quantity = lq_product + p_quantity;
                                    lq_product.save((err) => {
                                        console.log(err)
                                    })
                                })
                            }
                        }
                    }
                    else{

                        if (err) console.log(err)
                    }

                    j = j + 1;
                    isLastCall = j==productLength;

                    if(isLastCall){
                        TransactionM.findOneAndDelete({id:id}, (err, transaction) => {
                            res.send(transaction)
                        })
                    }


                })
            }   
        }
    })


})

//Add a post
router.post('/api/transactions', (req, res) => {

    //The transaction we're preparing to send
    let newTransactionM = new TransactionM();

    var j = 0;

    var productLength = req.body.product.length;
    for(var i=0; i<productLength; i++) {

        var quantitiesAvailable =true
        var productsAvailable = true
       
        //Get the product properties
        let p_name = req.body.product[i].name;
        let p_quantity = req.body.product[i].quantity


        ProductM.findOne({name:p_name}).exec((err, product) => {
            if(product)
            {
                //If the requested quantity is bigger than what we have in the stock than show error
                if(product.quantity<p_quantity){

                    quantitiesAvailable=false

                    newTransactionM.product.push(                           
                         {
                        "name": p_name,
                        "quantity": product.quantity
                    })  
                }
            }
            else{

                productsAvailable = false

                newTransactionM.product.push(               
               {
                    "name": p_name,
                    "quantity": 0
                })

        
    
            }

            j = j + 1;
            isLastCall = j==productLength;

            if(isLastCall){

                if(!quantitiesAvailable || !productsAvailable){

                    res.send(newTransactionM)

                }else
                {

                    var query = inc("userid")


                    clientPhone = req.body.clientPhone
                    
                    for(var i=0; i<productLength; i++) {

                        //Get the product properties
                        let p_name = req.body.product[i].name;
                        let uProduct = req.body.product[i]

                        ProductM.findOne({name:p_name}).exec((err, product) => {

                            quantity = product.quantity
                            
                            updateProduct(product, uProduct)

                            existInLQ = quantity<100 
                            enterLQ = product.quantity<100

                            if(existInLQ){
                                updateLQProduct(product)
                            }else 

                            if(enterLQ){
                                createLQProduct(product)
                            }
                        })
                    }
                    
                    ClientM.findOne({phone:clientPhone}).exec((err, client) => {

                        if(!client) var client = new ClientM({phone:clientPhone});

                        if(client){

                            client.transaction.push(newTransactionM)

                            // lenT = client.transaction.length;
                            
                            // client.transaction[lenT] = {
                            //     id: newTransactionM.id,
                            //     product: []
                            // }


                            // for(var i=0; i<productLength; i++){

                            //     //Get the product properties
                            //     let p_name = req.body.product[i].name;
                            //     let p_quantity = req.body.product[i].quantity

                            //     lenP = client.transaction[lenT].product.length;

                            //     client.transaction[lenT].product[lenP] = {
                            //         name: p_name,
                            //         quantity: p_quantity
                            //     }

                            // }

                            client.save((err) => {
                                console.log(err)
                            })
                        }

                        //Show error if any
                        if(err) console.log(err)
                    })

                    newTransactionM.set(req.body)

                    newTransactionM.date = Date.now()

                    query.exec((err, count) => {
                        // newTransactionM.set({id:count.seq})
                        newTransactionM.id = count.seq
                        newTransactionM.save((err, transaction)=>{
                            console.log(transaction)
                            res.send(transaction)
                        })
                        })
                }
            }
        })
    }
})


updateProduct = function(product, uProduct){

    //Update the product quantity 
    product.quantity = product.quantity - uProduct.quantity;
    product.save((err) => {
        if(err) console.log(err)
    })
}

updateLQProduct = function(product){

    Lq_productM.findOne({name:product.name}).exec((err, result) => {

        result.quantity = product.quantity;

        result.save((err) => {
           if(err) console.log(err)
        })
    })
}

createLQProduct = function(product){

    var lqp = new Lq_productM({
        name: product.name,
        quantity: product.quantity
    })

    lqp.save((err) => {
       if(err) console.log(err)
    })
}




module.exports = router;