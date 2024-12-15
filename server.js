// Importation des bibliothèques //
const express = require('express');
const fs = require('fs');
const bcrypt = require('bcryptjs'); 
const bodyParser = require('body-parser');
const session = require('express-session'); // Session avec express js
const path = require('path');
const app = express();
require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;

/* Import perso */
const getConnection = require('./utils/mysql');
const mysql = getConnection(process.env.DB_USER, process.env.DB_PASS, process.env.DB_DATABASE, process.env.DB_HOST);
/*                 /                /                                */

// Définir EJS comme moteur de vue
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware pour afficher les headers de chaque requête
/* app.use((req, res, next) => {
  console.log('Headers de la requête:', req.headers); // Affiche les headers dans la console
  next(); // Passe au middleware suivant ou à la route
});*/

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // 'secure: true' nécessite HTTPS
}));

app.get('/', (req, res) => {
    const error = req.session.error;
    req.session.error = null; // Effacez le message après affichage
    if (req.session.user) {
        return res.redirect('/bibliotheque');
    } else {
        res.render('login', { error}); // Passez le message à la vue
        //res.sendFile(path.join(__dirname, 'views', 'login.ejs'));
    }
});

// Lancement du serveur
const primaryPort = process.env.PORT;
const PORT = secondaryPort = 3000;

// Lance le serveur sur le port qui est prédéféfini dans le dossier .env sinon lance sur le port 3000 s'il n'est pas disponible.
const startServer = (PORT) => {
app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${PORT} est déja utilisé, on essaye sur un autre port...`);
            startServer(PORT === primaryPort ? secondaryPort : primaryPort); // Essai du second port.
        } else {
            console.error('Erreur lors du lancement serveur.', err);
        }
    });
};
startServer(primaryPort);