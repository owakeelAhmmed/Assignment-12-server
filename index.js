const express = require('express');
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


    const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.urclyui.mongodb.net/?retryWrites=true&w=majority`;

    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

    async function run(){

      try{
        await client.connect();
        console.log("connected to database")
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