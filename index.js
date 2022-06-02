const express = require('express');
const app = express();
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const { default: Stripe } = require('stripe');
const stripe = require('stripe')(process.env.STEIPE_SECRET_KEY);


const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
 

      

      

    const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.urclyui.mongodb.net/?retryWrites=true&w=majority`;

    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


    function verifyJWT(req, res, next){
      const authHeader = req.headers.authorization;
      if(!authHeader){
        return res.status(401).send({message: 'UnAuthorized access'});
      }
      const token = authHeader.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
        if(err){
          return res.status(403).send({message: 'Forbidden access'})
        }
        req.decoded = decoded;
        next();
      })
    }

    async function run(){

      try{
        await client.connect();
        const productCollection = client.db('supergear_data').collection('product');
        const bookingCollection = client.db('supergear_data').collection('booking');
        const userCollection = client.db('supergear_data').collection('users');
        const paymentCollection = client.db('supergear_data').collection('payments');
        const addproductCollection = client.db('supergear_data').collection('addproducts');
        const reviewCollection = client.db('supergear_data').collection('reviews');



        app.get('/product', async (req, res) =>{
          const query ={};
          const cursor = productCollection.find(query);
          const product = await cursor.toArray();
          res.send(product);
        })

        app.get('/admin/:email', async(req, res)=> {
          const email = req.params.email;
          const user = await userCollection.findOne({email: email});
          const isAdmin = user.role === 'admin';
          res.send({admin: isAdmin})
        })

        // admin api
        app.put('/user/admin/:email', verifyJWT, async(req, res)=>{
          const email = req.params.email;
          const requester = req.decoded.email;
          const requesterAccount = await userCollection.findOne({email: requester});
          
          if(requesterAccount.role === 'admin'){
            const filter = {email: email};
              const updateDoc ={
                $set: {role:'admin'},
              };
              const result = await userCollection.updateOne(filter,updateDoc);
              res.send(result);
          }
          else{
            res.status(403).send({message: 'forbidden'});
          }

           })


           //payment api
           app.post('/create-payment-intent',verifyJWT, async(req, res) => {
             const service = req.body;
             const price = service.price;
             const amount = price*100;
             const paymentIntent = await stripe.paymentIntents.create({
               amount: amount,
               currency: 'usd',
               payment_method_types:['card']
             });
             res.send({clientSecret: paymentIntent.client_secret})
           });


          //  create user email
        app.put('/user/:email', async(req, res)=>{
          const email = req.params.email;
          const user = req.body;
          const filter = {email: email};
          const options = {upsert: true};
          const updateDoc ={
            $set: user,
          };
          const result = await userCollection.updateOne(filter,updateDoc, options);
          const token = jwt.sign({email: email},process.env.ACCESS_TOKEN_SECRET,{expiresIn: '1h'});
          res.send({result, token});
           })

        app.get('/user', verifyJWT, async(req, res) =>{
          const users = await userCollection.find().toArray();
          res.send(users);
        })

        // product id api
        app.get('/product/:id', async(req, res) => {
          const id = req.params.id;
          const query = {_id: ObjectId(id)};
          const product = await productCollection.findOne(query);
          res.send(product);
        })


        // booking api
        app.get('/booking', verifyJWT, async(req, res) =>{
          const email = req.query.email;
          console.log(email)
          const decodedEmail = req.decoded.email;
          if(email === decodedEmail){
            const query = {userEmail: email }
            const result = await bookingCollection.find(query).toArray();
              res.send(result);
          }
          else{
            return res.status(403).send({message: 'forbidden access'})
          }

        })

        app.get('/booking/:id', verifyJWT, async(req, res) =>{
          const id = req.params.id;
          const query = {_id: ObjectId(id)};
          const booking = await bookingCollection.findOne(query);
          res.send(booking);
        })


        // Booking update 

        app.patch('/booking/:id', verifyJWT, async(req, res) => {
          const id = req.params.id;
          const payment = req.body;
          const filter = {_id: ObjectId(id)};
          const updateDoc = {
            $set: {
              paid: true,
              transationId: payment.transationId
            }
          }
          const result = await paymentCollection.insertOne(payment);
          const updateBooking = await bookingCollection.updateOne(filter, updateDoc);
          res.send(updateDoc);
        })

        // add product api
        app.post('/addproduct', async(req, res) =>{
          const product = req.body;
          const result = await addproductCollection.insertOne(product);
          res.send(result);
        })

        app.get('/addproduct', async(req, res) =>{
          const result = await addproductCollection.find().toArray();
          res.send(result);
        })

        app.delete('/addproduct/:id', async(req, res) =>{
          const id = req.params.id;
          const query = {_id: ObjectId(id) };
          const result = await addproductCollection.deleteOne(query);
          res.send(result);
        })
        // add product api end



        // Reviews api
        app.post('/reviews', async(req, res) =>{
          const review = req.body;
          const result = await reviewCollection.insertOne(review);
          res.send(result);
        })


         app.get('/reviews', async(req, res) =>{
          const result = await reviewCollection.find().toArray();
          res.send(result);
        })




        app.post('/booking', async(req, res) =>{
          const booking = req.body;
          const result = await bookingCollection.insertOne(booking);
          res.send(result);
        })


      }
      finally{

      }



    }
    run().catch(console.dir);






    app.get('/', (req, res) => {
      res.send('Sepeu Gear Server Is Runing')
    });

    app.listen(port, () => {
      console.log(`SuperGear App listening on port ${port}`)
    })
