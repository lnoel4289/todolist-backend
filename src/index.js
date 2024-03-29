import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";

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
// Default welcome endpoint ("/")
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

// User signup
app.post("/signup", async (req, res) => {
  const userSignup = req.body;
  // regex matching forbidden characters
  const pseudoRegex = /^[^<>&"'\\/]{1,50}$/;
  // Function testing if entry contains any forbidden characters
  function pseudoAllowed(entry) {
    return pseudoRegex.test(entry);
  }

  try {
    // If pseudo contains any forbidden character
    if (!pseudoAllowed(userSignup.pseudo)) {
      res
        .status(400)
        .send(
          `Erreur:\nLes caractères suivants sont interdits lors de la création du pseudo: <>&"'\\/\nLe pseudo ne doit pas excéder 50 caractères.`
        );
    } else {
      // If created pseudo already exists
      const pseudoExists = await usersCollection.findOne(
        {
          pseudo: userSignup.pseudo,
        },
        // projection aims return only "pseudo" field (with also _id, by default)
        { projection: { pseudo: 1 } }
      );
      if (pseudoExists) {
        res
          .status(403)
          .send(
            "Ce pseudo est déjà enregistré ! Veuillez en utiliser un autre."
          );
      } else {
        // If password contains any forbidden character

        // If password doesn't match allowed pattern
        const passwordRegex =
          /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+])(?!.*\s).{8,100}$/;
        const passwordAllowed = passwordRegex.test(userSignup.password);
        if (!passwordAllowed) {
          res
            .status(400)
            .send(
              "Erreur: le mot de passe doit correspondre aux critères suivants:\n - 8 caractères minimum \n- au moins une majuscule\n- au mois une minuscule\n- au moins un chiffre\n- au moins un caractère spécial\n- ne comporte pas d'espace"
            );
        } else {
          bcrypt
            .hash(userSignup.password, 10)
            .then((hash) => {
              usersCollection.insertOne({
                pseudo: userSignup.pseudo,
                password: hash,
              });
            })
            .then(
              res
                .status(201)
                .send(
                  `L'utilisateur ${userSignup.pseudo} a bien été enregistré ! Vous pouvez maintenant vous connecter`
                )
            )
            .catch(() => {
              res.status(500).send("La requête à échoué ! Veuillez réessayer");
            });
        }
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la connexion à la base de données");
  }
});

// User login
app.get("/login", async (req, res) => {
  try {
    const user = await usersCollection.findOne({ pseudo: req.body.pseudo });
    if (!user) {
      return res
        .status(401)
        .send("Les informations fournies ne permettent pas de vous identifier");
    }
    bcrypt.compare(req.body.password, user.password).then((valid) => {
      if (!valid) {
        return res
          .status(401)
          .send(
            "Les informations fournies ne permettent pas de vous identifier"
          );
      }
      res
        .status(200)
        .send(`Bienvenue ${user.pseudo} ! Vous êtes maintenant connecté.`);
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la connexion à la base de données");
  }
});

// Start app
app.listen(port, () => {
  console.log("app started successfully !");
});
