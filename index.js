const express = require('express');
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


    const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.urclyui.mongodb.net/?retryWrites=true&w=majority`;

    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

    async function run(){

      try{
        await client.connect();
        const productCollection = client.db('supergear_data').collection('product');
        const bookingCollection = client.db('supergear_data').collection('booking');

        app.get('/product', async (req, res) =>{
          const query ={};
          const cursor = productCollection.find(query);
          const product = await cursor.toArray();
          res.send(product);
        })

        app.get('/product/:id', async(req, res) => {
          const id = req.params.id;
          const query = {_id: ObjectId(id)};
          const product = await productCollection.findOne(query);
          res.send(product);
        })

        app.get('/booking', async(req, res) =>{
          const email = req.query.email;
          const query = {email: email }
          const result = await bookingCollection.find(query).toArray();
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