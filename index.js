const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require("cors");
const jwt = require('jsonwebtoken');
require("dotenv").config();
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

        // make admin
        app.put("/make-admin/:email", verifyJWT, async (req, res) => {
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

        // get specific part info
        app.get("/part/:id", async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const part = await partCollection.findOne(query);
            res.send(part);
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

        // get specific orders with email
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
