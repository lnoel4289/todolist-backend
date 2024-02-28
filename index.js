import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";
import express from "express";
import cors from "cors";

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
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la connexion à la base de données");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);
// MONGO ends

// Express
const app = express();
const port = 4000;

// routes
app.use(cors());
app.use(express.json());

app.get("/login", async (req, res) => {
  try {
    const userRequest = req.body;
    await client.connect();
    const db = client.db("mytodolist");
    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne(userRequest);
    if (!user) {
      res
        .status(401)
        .send("Les informations fournie ne permettent pas de vous identifier");
    } else {
      res.status(200).send(
        `Bienvenue ${user.pseudo} ! Vous êtes maintenant connecté.`
      );
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la connexion à la base de données");
  } finally {
    await client.close();
  }
});

// app.post("/signup", async (req, res) => {
//   try {
//     await client.connect();
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Erreur lors de la connexion à la base de données");
//   } finally {
//     client.close();
//   }
// });

// starts app
app.listen(port, () => {
  console.log("app started successfully !");
});
