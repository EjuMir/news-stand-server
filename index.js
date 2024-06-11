const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const jwt = require('jsonwebtoken');
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
    const newsCollection = client.db('newsStand').collection('newsCollection');
    const allUsers = client.db('newsStand').collection('users');
    const publishers = client.db('newsStand').collection('Publisher');
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
      console.log(token);
      res.send({ token });
    })

    //All news collection
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
        const updateView = {
            $set:{
                views: view.views
            }
        }
        const updateNews = await newsCollection.updateOne(query, updateView);
        res.send(updateNews);
    })

    // All users collection

    app.post('/users', async(req, res) => {
      const user = req.body;
      const query = {email : user.email};
      const userExist = await allUsers.findOne(query);
      if(userExist){
        return res.send({message: 'User already exists', insertedId:null});
      }
      const newUser = await allUsers.insertOne(user);
      res.send(newUser);
    })

    app.get('/users', async(req, res) => {
       const user = await allUsers.find().toArray();
       res.send(user);
    })

    //Publisher collection get 

    app.get('/publisher', async (req, res) => {
        const publisher = await publishers.find().toArray();
        res.send(publisher);
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
