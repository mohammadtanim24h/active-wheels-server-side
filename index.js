const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
    res.send("Active wheels are keeping your wheels active");
});

app.listen(port, () => {
    console.log("Listening to Active Wheels, port", port);
});
