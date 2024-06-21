const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const stripe = require('stripe')(process.env.STRIPE_KEY)

app.use(cors({
  origin: ['http://localhost:5173'],
  allowedHeaders: 'Content-Type, Authorization',
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

// Middleware - Verify token

const verifyToken = (req, res, next) => {
  // console.log(req.headers.authorization);
  if (!req.headers.authorization) {
    return res.status(401).send({ message: 'unauthorized attempt' });
  }
  const token = req.headers.authorization;
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'unauthorized attempt' })
    }
    req.decoded = decoded;
    next();
  })
}

async function run() {

  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    // Collections
    const newsCollection = client.db('newsStand').collection('newsCollection');
    const allUsers = client.db('newsStand').collection('users');
    const publishers = client.db('newsStand').collection('Publisher');
    const articleRequest = client.db('newsStand').collection('ArticleRequest');
    const paymentCollection = client.db('newsStand').collection('PaymentCollection');

    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
      res.send({ token });
    })

    //All news collection
    app.get('/allNews', async (req, res) => {
      const allNews = await newsCollection.find().toArray();
      res.send(allNews);
    })

    app.post('/allNews', async (req, res) => {
      const news = req.body;
      const newNews = await newsCollection.insertOne(news);
      res.send(newNews);
    })

    app.delete('/allNews/:id', async (req, res) => {
      const id = req.params.id;
      const query = { id: id };
      const result = await newsCollection.deleteOne(query);
      res.send(result);

    })

    app.get('/allNews/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const singleNews = await newsCollection.findOne(query);
      res.send(singleNews);

    })

    app.patch('/allNews/:id', async (req, res) => {
      const id = req.params.id;
      const idSub = req.params.id;
      const filter = { id: idSub };
      console.log(filter);
      const body = req.body;
      const query = { _id: new ObjectId(id) }
      const view = req.body;
      const updateView = {
        $set: {
          views: view.views
        }
      }
      const updateSub = {
        $set: {
          subscription: body.subscription,
        }
      }
      const updateNews = await newsCollection.updateOne(query, updateView);
      const updateSubscription = await newsCollection.updateOne(filter, updateSub);
      res.send({ updateNews, updateSubscription });
    })


    // All users collection

    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const userExist = await allUsers.findOne(query);
      if (userExist) {
        return res.send({ message: 'User already exists', insertedId: null });
      }
      const newUser = await allUsers.insertOne(user);
      res.send(newUser);
    })

    app.get('/users', async (req, res) => {
      const user = await allUsers.find().toArray();
      res.send(user);
    })

    app.patch('/users/:email', async (req, res) => {
        const email = req.params.email;
        const filter = { email: email };
        const body = req.body;
        const options = {upsert: true}
        const updatedDoc = {
          $set: {
            subscript : body.subscript
          }
        }
        const result = await allUsers.updateOne(filter, updatedDoc, options);
        res.send(result);
      })
    

    // Publisher collection get 

    app.get('/publisher', async (req, res) => {
      const publisher = await publishers.find().toArray();
      res.send(publisher);
    })

    app.post('/publisher', async (req, res) => {
      const publisher = req.body;
      const newPublisher = await publishers.insertOne(publisher);
      res.send(newPublisher);
    })

    // Admin related collection

    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await allUsers.updateOne(filter, updatedDoc);
      res.send(result);
    })

    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const userResult = await allUsers.findOne(query);
      let admin = false;
      if (userResult?.role === "admin") {
        admin = true;
      }
      res.send({ admin });
    })

    // update users
    app.patch('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = req.body;
      const updatedDoc = {
        $set: {
          name: user.updatedName,
          image: user.updatedPhoto
        }
      };
      const result = await allUsers.updateOne(query, updatedDoc);
      res.send(result);
    })

    //article request collection

    app.post('/articleReq', verifyToken, async (req, res) => {
      const item = req.body;
      const result = await articleRequest.insertOne(item);
      res.send(result);
    });

    app.get('/articleReq', verifyToken, async (req, res) => {
      const result = await articleRequest.find().toArray();
      res.send(result);
    });

    app.patch('/articleReq/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const body = req.body;
      const option = { upsert: true };
      const updatedDoc = {
        $set: {
          declineReason: body.declineReason,
          status: body.status,
          subscription: body.subscription,
        }
      }
      const result = await articleRequest.updateOne(filter, updatedDoc, option);
      res.send(result);
    })

    app.delete('/articleReq/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await articleRequest.deleteOne(filter);
      res.send(result);
    })

    // Payment Intent 
    app.post('/create-payment-intent', async(req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      console.log(amount)

      const payment = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });

      res.send({
        clientSecret: payment.client_secret
      })
    });

    app.get('/payments/:email', verifyToken, async (req, res) => {
      const query = { email: req.params.email }
      if (req.params.email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/payments', async (req, res) => {
      const payment = req.body;
      const paymentResult = await paymentCollection.insertOne(payment);
      console.log(payment);

      res.send(paymentResult);
    })

    app.get('/payments', async (req, res) =>{
      const result = await paymentCollection.find().toArray();
      res.send(result);
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
