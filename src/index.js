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

// Express
const app = express();
const port = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
// Default welcome message ("/")
app.get("/", async (req, res) => {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    res
      .status(200)
      .send("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la connexion à la base de données");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
});

// User login
app.get("/login", async (req, res) => {
  try {
    const userRequest = req.body;
    await client.connect();
    const db = client.db("mytodolist");
    const users = db.collection("users");
    const user = await users.findOne(userRequest);
    if (!user) {
      res
        .status(401)
        .send("Les informations fournie ne permettent pas de vous identifier");
    } else {
      res
        .status(200)
        .send(`Bienvenue ${user.pseudo} ! Vous êtes maintenant connecté.`);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la connexion à la base de données");
  } finally {
    await client.close();
  }
});

// User signup
app.post("/signup", async (req, res) => {
  try {
    const newUser = req.body;
    await client.connect();
    const db = client.db("mytodolist");
    const users = db.collection("users");
    const pseudoExists = await users.findOne({ pseudo: newUser.pseudo });
    if (!pseudoExists || pseudoExists === undefined || pseudoExists === null) {
      const insertedNewUser = await users.insertOne(newUser);
      if (
        !insertedNewUser ||
        insertedNewUser === undefined ||
        insertedNewUser === null
      ) {
        res.status(500).send("La requête à échoué ! Veuillez réessayer");
      } else {
        res
          .status(201)
          .send(`L'utilisateur ${newUser.pseudo} a bien été enregistré !`);
      }
    } else {
      res
        .status(403)
        .send("Ce pseudo est déjà utilisé ! Merci de le modifier.");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la connexion à la base de données");
  } finally {
    client.close();
  }
});

// Start app
app.listen(port, () => {
  console.log("app started successfully !");
});
