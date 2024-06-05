const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
    origin:['http://localhost:5173']
}));
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cckizs6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
   
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    
    // Collections
    const newsCollection = client.db('newsStand').collection('newsCollection')
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    app.get('/allNews', async (req, res) => {
        const allNews = await newsCollection.find().toArray();
        res.send(allNews);
    })


    app.get('/allNews/:id', async (req, res) => {
        const id = req.params.id;
        const query = {_id : new ObjectId(id) }
        const singleNews = await newsCollection.findOne(query);
        res.send(singleNews);
        
    })
    app.patch('/allNews/:id', async (req, res) => {
        const id = req.params.id;
        const query = {_id : new ObjectId(id) }
        const view = req.body;
        console.log(view);
        const updateView = {
            $set:{
                views: view.views
            }
        }
        const updateNews = await newsCollection.updateOne(query, updateView);
        res.send(updateNews);
    })

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`listening at ${port}`)
})
run().catch(console.dir);
