const express = require('express');
const app = express();
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
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

        app.get('/product', async (req, res) =>{
          const query ={};
          const cursor = productCollection.find(query);
          const product = await cursor.toArray();
          res.send(product);
        })

        // admin api
        app.put('/user/admin/:email', async(req, res)=>{
          const email = req.params.email;
          const filter = {email: email};
          const updateDoc ={
            $set: {role:'admin'},
          };
          const result = await userCollection.updateOne(filter,updateDoc);
          res.send(result);
           })




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

        
        // bookin api 
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