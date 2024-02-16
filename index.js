import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";
import express from "express";

dotenv.config();

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const uri = process.env.STRING_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);

const app = express();
const port = 4000;

// routes
app.get("/", (_, res) => {
  res.send("Hello world !");
});

// starts app
app.listen(port, () => {
  console.log("app started successfully !");
});
