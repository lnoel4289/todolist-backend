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
// Connexion to Mongo database
async function runDb() {
  try {
    await client.connect();
    console.log("connexion à la base de données réussie !");
  } catch (err) {
    console.log(err);
  }
}
runDb();

// Express
const app = express();
const port = process.env.PORT || 4000;

// DB vars
const mytodolistDb = client.db("mytodolist");
const usersCollection = mytodolistDb.collection("users");

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
// Default welcome message ("/")
app.get("/", async (_, res) => {
  try {
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    res
      .status(200)
      .send("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la connexion à la base de données");
  }
});

// User login
app.get("/login", async (req, res) => {
  try {
    const userLogin = req.body;
    const user = await usersCollection.findOne(userLogin);
    if (!user) {
      res
        .status(401)
        .send("Les informations fournies ne permettent pas de vous identifier");
    } else {
      res
        .status(200)
        .send(`Bienvenue ${user.pseudo} ! Vous êtes maintenant connecté.`);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la connexion à la base de données");
  }
});

// User signup
app.post("/signup", async (req, res) => {
  try {
    const userSignup = req.body;
    const pseudoExists = await usersCollection.findOne(
      {
        pseudo: userSignup.pseudo,
      },
      // projection aims return only "pseudo" field (also _id by default)
      { projection: { pseudo: 1 } }
    );
    if (pseudoExists) {
      res
        .status(403)
        .send("Ce pseudo est déjà enregistré ! Veuillez en utiliser un autre.");
    } else {

      // const newPassword = userSignup.password;
      // if(password){}else{};

      const successfulSignup = await usersCollection.insertOne(userSignup);
      if (!successfulSignup.acknowledged) {
        res.status(500).send("La requête à échoué ! Veuillez réessayer");
      } else {
        res
          .status(201)
          .send(`L'utilisateur ${userSignup.pseudo} a bien été enregistré !`);
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la connexion à la base de données");
  }
});

// Start app
app.listen(port, () => {
  console.log("app started successfully !");
});
