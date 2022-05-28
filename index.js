const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require("cors");
const jwt = require('jsonwebtoken');
require("dotenv").config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gmkk05y.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// verify jwt
function verifyJWT (req, res, next) {
    const authHeader = req.headers.authorization;
    if(!authHeader) {
        return res.status(401).send({message: "Unauthorized Access"});
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded) {
        if(err) {
            return res.status(403).send({message: "Forbidden Access"});
        }
        req.decoded = decoded;
        next();
    });
}

async function run() {
    try {
        await client.connect();
        const partCollection = client.db("activeWheels").collection("parts");
        const orderCollection = client.db("activeWheels").collection("orders");
        const reviewCollection = client.db("activeWheels").collection("reviews");
        const userCollection = client.db("activeWheels").collection("users");


        // verify admin
        const verifyAdmin = async (req, res, next) => {
            const requesterEmail = req.decoded.email;
            const requesterAccount = await userCollection.findOne({email: requesterEmail});
            if(requesterAccount.role === 'admin') {
                next();
            }
            else {
                return res.status(403).send({message: "Forbidden Access"});
            }
        }

        // create payment intent
        app.post("/create-payment-intent", verifyJWT, async (req, res) => {
            const service = req.body;
            const price = service?.price;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                amount,
                currency: "usd",
                payment_method_types: ["card"]
            });

            res.send({clientSecret: paymentIntent.client_secret})
        })

        // add user in db
        app.put("/user/:email", async (req, res) => {
            const email = req.params.email;
            const filter = {email};
            const user = req.body;
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({email}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1d'});
            res.send({result, token});
        })

        // get specific user info with email 
        app.get("/user/:email", async (req, res) => {
            const email = req.params.email;
            const query = {email};
            const user = await userCollection.findOne(query);
            res.send(user);
        })

        // update user info
        app.put("/update-user-info/:email", verifyJWT, async (req, res) => {
            const email = req.params.email;
            const filter = {email};
            const userInfo = req.body;
            const updateDoc = {
                $set: userInfo,
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        // make admin
        app.put("/make-admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
            const email = req.params.email;
            const filter = {email};
            const updateDoc = {
                $set: {role: 'admin'},
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        // get all users from db
        app.get("/users", verifyJWT, async (req, res) => {
            const users = await userCollection.find({}).toArray();
            res.send(users);
        })

        // check admin role
        app.get("/check-admin/:email", verifyJWT, async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({email});
            const isAdmin = user?.role === 'admin';
            res.send({admin: isAdmin});
        })

        // get all parts
        app.get("/parts", async (req, res) => {
            const parts = await partCollection.find({}).toArray();
            res.send(parts);
        })

        // get specific part info from db
        app.get("/part/:id", async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const part = await partCollection.findOne(query);
            res.send(part);
        })

        // delete a part
        app.delete("/part/:id", verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await partCollection.deleteOne(query);
            res.send(result);
        })

        // add part to db
        app.post("/part", verifyJWT, async (req, res) => {
            const part = req.body;
            const result = await partCollection.insertOne(part);
            res.send(result);
        })

        // add order to db
        app.post("/order", async (req, res) => {
            const orderInfo = req.body;
            const result = await orderCollection.insertOne(orderInfo);
            res.send(result);
        })

        // get specific orders with user email
        app.get("/order/:email", verifyJWT, async (req, res) => {
            const email = req.params.email;
            const decodedEmail = req.decoded.email;
            if(email === decodedEmail) {
                const query = {email};
                const orders = await orderCollection.find(query).toArray();
                return res.send(orders);
            }
            else {
                return res.status(403).send({message: "Forbidden Access"});
            }
        })

        // get a single order by id
        app.get("/get-order/:id", verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const order = await orderCollection.findOne(query);
            res.send(order);
        })

        // update order after payment
        app.patch("/order/:id", verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = {_id: ObjectId(id)};
            const payment = req.body;
            const updateDoc = {
                $set: payment,
            };
            const result = await orderCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        // delete a order
        app.delete("/order/:id", async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        })

        // update part quantity
        app.put("/update-part/:id", async (req, res) => {
            const id = req.params.id;
            const part = req.body;
            const filter = {_id: ObjectId(id)};
            const options = { upsert: true };
            const updatedPart = {
                $set: part,
            };
            const result = await partCollection.updateOne(filter, updatedPart, options);
            res.send(result);
        })

        // get all reviews
        app.get("/reviews", async (req, res) => {
            const reviews = await reviewCollection.find({}).toArray();
            res.send(reviews);
        })

        // add review to db
        app.post("/review", async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        })
    }
    finally {

    }
}

run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("Active wheels are keeping your wheels active");
});

// testing heroku

app.listen(port, () => {
    console.log("Listening to Active Wheels, port", port);
});
