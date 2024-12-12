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

// Middleware de journalisation
function loggerMiddleware(req, res, next) {
    const logFilePath = path.join(__dirname, 'requests.log');
    const logEntry = `${new Date().toISOString()} - ${req.method} ${req.url}\n`;

    // Append log au fichier
    fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) {
            console.error('Erreur lors de l\'écriture du journal:', err);
        }
    });

    // Passer au middleware suivant
    next();
}

// Ajouter le middleware
app.use(loggerMiddleware);
//

app.use((req, res, next) => {
    console.log(`Request URL: ${req.url}`);
    next();
});


// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: SECRET_KEY,
    resave: false,
    saveUninitialized: true
}));

app.get('/', (req, res) => {
    if (req.session.user) {
        // Si l’utilisateur est connecté, rediriger vers la bibliothèque
        return res.redirect('/bibliotheque');
    } else {
        res.sendFile(path.join(__dirname, 'views', 'login.html'));
    }
});

// Page d'enregistrement utilisateur
app.get('/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/bibliotheque'); // Redirection vers le dashboard si la personne est connectée
    }
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

// Page d'enregistrement
app.post('/register', async (req, res) => {
    const { mail, username, password, confirmPassword } = req.body;
    //console.log(mail, username, password, confirmPassword);

    const query_check = `SELECT * FROM membre WHERE username = ?`;
    try {
        mysql.query(query_check, [username], async function(err, results, fields){
            if (err) {
                console.error('Database query error:', err.message);
                return res.status(500).send('Server error');
            }
            
            if (results.length > 0) {
                return res.status(400).send("Nom d'utilisateur déjà existant !");
            }
            else{
                let check_mail = mysql.query(`SELECT * FROM membre WHERE mail = ?`, [mail], async function(err, results, fields){ 
                    if (err) {
                        console.error('Database query error:', err.message);
                        return res.status(500).send('Server error');
                    }
                    
                    if (results.length > 0) {
                        return res.status(400).send('Email already exists!');
                    }else {
                        //Vérification que les deux mots de passes soient les mêmes
                        if (password !== confirmPassword) {
                            return res.send('<h1>Les mots de passe ne correspondent pas</h1><a href="/register">Réessaye !</a>');
                        }else{
                            // Hacher le mot de passe avant de l'enregistrer
                            const hashedPassword = await bcrypt.hash(password, 10); // 10 est le "salt rounds"
                            
                            // Enregistrer l'utilisateur avec le mot de passe haché
                            mysql.query('INSERT INTO membre (mail, username, password) VALUES (?, ?, ?)', [mail, username, hashedPassword],function (err, results, fields){
                                console.log(err);
                                console.log(results);
                                console.log(fields);
                            })
                            console.log(hashedPassword);
                            // Register the new user
                            req.session.user = username; // Log the user in automatically after registration
                            res.send(`<h1>Enregistrement confirmée ! Bienvenue, ${username}!</h1><a href="/logout">Logout</a>`);
                        }
                    }
                })
            }
        })
    }catch(error){
        console.error(error);
        res.status(500).send('Erreur lors de l\'enregistrement');
    }
})
// Page dashboard, authentication obligatoire
app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    res.send(`<h1>Bienvenue sur le dashboard utilisateur, ${req.session.user}!</h1><a href="/logout">Logout</a>`);
});

// Bibliotheque page
/* app.get('/bibliotheque', (req, res) => {
    const data = {
        title: 'Bibliotheque - Bienvenue sur ExpressJS',
        message: "C'est une page dynamique avec EJS !",
    };
    const query = 'SELECT * FROM `emprunt`'
    mysql.query(query,function(err,results, fields){
        if (err) {
            console.log(err);
        } else {
            console.log(results);
            console.log(fields);
            console.log("Aucune erreur");
        }
    })
    res.render('bibliotheque', data);  // Render the "index.ejs" template
}); */

app.get('/bibliotheque', (req, res) => {
    res.render('bibliotheque'); // register.ejs doit être dans le dossier 'views'
});

// Page d'enregistrement utilisateur
app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/bibliotheque'); // Redirection vers le dashboard si la personne est connectée
    }
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Handle login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(username,password);
    if (!username || !password) {
        return res.status(400).send("Nom d'utilisateur et mot de passe requis !");
    }

    // Query the database for the user
    const query = 'SELECT password FROM membre WHERE username = ?';
    mysql.query(query, [username], async (err, results) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).send('Erreur serveur');
        }

        if (results.length === 0) {
            return res.status(404).send('Utilisateur non trouvé !');
        }

        const hashedPassword = results[0].password;

        try {
            // Compare le mot de passe fourni au mot de passe haché et vérifie si c'est le même
            const isMatch = await bcrypt.compare(password, hashedPassword);
            if (isMatch) {
                res.status(200).send(`<h1>Authentifaction réussie, ${req.session.user}!</h1><a href="/bibliotheque">Bibliotheque</a>`);
            } else {
                res.status(401).send('Informations d’identification non valides');
            }
        } catch (err) {
            console.error('Erreur lors de la comparaison des mots de passe', err.message);
            res.status(500).send('Erreur serveur');
        }
    });
});

// Handle logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
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