const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gmkk05y.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const partCollection = client.db("activeWheels").collection("parts");
        const orderCollection = client.db("activeWheels").collection("orders");

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

        // add order to db
        app.post("/part", async (req, res) => {
            const orderInfo = req.body;
            const result = await orderCollection.insertOne(orderInfo);
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
    }
    finally {

    }
}

run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("Active wheels are keeping your wheels active");
});

app.listen(port, () => {
    console.log("Listening to Active Wheels, port", port);
});
