const express = require('express')
const router = express.Router()

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/mydb', { useNewUrlParser: true   });

const ClientM = mongoose.model('clients',
{ phone: Number,
    transaction: [{ id:String , clientPhone: String,
        product: [{
        name:String,
        quantity: Number
    }]
     }]
});


// Send all clients
router.get('/api/clients', (req, res) => {
    ClientM.find((err, rproduct) => {
        res.send(rproduct)
    })
})


//Send the requested post
router.get('/api/clients/:id', (req, res) => {

    var id = mongoose.Types.ObjectId(req.param("id"));
    ClientM.findById(id, (err, rproduct) => {
        res.send(rproduct)
    })
})


//Delete the post
router.delete('/api/clients/:id', (req, res) => {
    var id = mongoose.Types.ObjectId(req.param("id"));
    ClientM.findByIdAndRemove(id, (err, rproduct) => {
        res.send(rproduct)
    })
})


//Add a post
router.post('/api/clients', (req, res) => {

    const newClientM = new ClientM(req.body);
    newClientM.save().then(() => {
        
        res.send(req.body)
    })
})


//Update the post
router.put('/api/clients/:id', (req, res) => {

    const newClientM = new ClientM(req.body);
    var id = mongoose.Types.ObjectId(req.param("id"));

   ClientM.findByIdAndUpdate(id, {$set: req.body}, () => {
       res.send(newClientM)
   })
})


module.exports = router;