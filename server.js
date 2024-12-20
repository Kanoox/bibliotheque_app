// Importation des bibliothèques //
const express = require('express');
const fs = require('fs');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const session = require('express-session'); // Session avec express js
const path = require('path');
const cookieParser = require('cookie-parser');
const app = express();
require('dotenv').config();

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

app.use(cookieParser()); // Middleware pour lire les cookies
app.use(express.json());
const SECRET_KEY = process.env.SECRET_KEY;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // 'secure: true' nécessite HTTPS
}));

// Middleware de vérification du token
function verifyToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: 'Accès refusé. Aucun token fourni.' });
    }
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Token invalide.' });
    }
}

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

// Page d'enregistrement utilisateur
app.get('/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/bibliotheque');
    }
    res.render('register');
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
                            mysql.query('INSERT INTO membre (mail, username, password, role) VALUES (?, ?, ?, ?)', [mail, username, hashedPassword, "user"],function (err, results, fields){
                                if (err) {
                                    console.error('Erreur lors de l\'insertion des données :', err.message);
                                    return;
                                }
                            
                                if (results.affectedRows === 1) {
                                    console.log('Données insérées avec succès !');
                                    console.log('Nouvel ID :', results.insertId);
                                    res.redirect('/login');
                                } else {
                                    console.log('Aucune ligne affectée, vérifiez vos données.');
                                }
                            })

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
app.get('/dashboard', verifyToken, (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    } else {
        const username = req.session.user.username;
        const query = 'SELECT nom, prenom, adresse, telephone, mail, role, username FROM membre WHERE username = ?'
        mysql.query(query, [username], (err, results, fields) => {
            //console.log(results);
            if (err) {
                console.error('Erreur lors de la récupération des données :', err);
                res.status(500).send('Erreur serveur.');
                return;
            }

            if (results.length === 0) {
                res.send('Utilisateur non trouvé.');
                return;
            }

            const user = results[0]; // Donnée de l'utilisateur;
            return res.render('dashboard', {user: results[0]}); // register.ejs doit être dans le dossier 'views'
        });
    }
});

// Bibliotheque page
app.get('/bibliotheque', (req, res) => {
    if(req.session.user){
        mysql.query('SELECT * FROM livre', function (err, results, fields) {
            if (err) {
                console.error('Erreur lors de la récupération des données:', err);
                return res.status(500).send('Erreur serveur');
            }
            //console.log(results)
            // Rendre la vue avec les données
            res.render('bibliotheque', { livres: results }); // Passer les données à EJS
        });
    }else{
        // Simuler une erreur
        const error = "Please log in to have access to the library";
        // Stocker l'erreur dans la session
        req.session.error = error;

        // Rediriger vers la page d'accueil
        res.redirect('/');
    }
});


// Page d'enregistrement utilisateur
app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/bibliotheque'); // Redirection vers le dashboard si la personne est connectée
    }
    res.redirect('/'); // 'ma-page' est le nom du fichier .ejs sans extension
});

// Handle login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    //console.log(username,password);
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
                //res.status(200).send(`<h1>Authentifaction réussie, ${req.session.user}!</h1><a href="/bibliotheque">Bibliotheque</a>`);
                req.session.user = { username }; // Stocker les informations de l'utilisateur

                // Générer un token JWT
                const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });

                // Stocker le token dans un cookie sécurisé (HTTP-only)
                res.cookie('token', token, {
                    httpOnly: true, // Empêche l'accès via JavaScript
                    secure: false, // Activez pour HTTPS
                    sameSite: 'strict', // Empêche le CSRF
                    maxAge: 3600000, // 1 heure
                });

                res.redirect('/protected');
            } else {
                res.status(401).send('Informations d’identification non valides');
            }
        } catch (err) {
            console.error('Erreur lors de la comparaison des mots de passe', err.message);
            res.status(500).send('Erreur serveur');
        }
    });
});

// Endpoint pour vérifier le token
app.get('/protected', verifyToken, (req, res) => {
    const token = req.cookies.token;

    if (!token) return res.status(401).json({ message: 'Non autorisé' });

    // Vérifiez le token
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Token invalide' });
        } 

        //res.json({ message: 'Accès autorisé', user: req.user });

        return res.redirect('/bibliotheque')
    });
});

// Handle logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

app.get('/edit_profil', (req, res) => {
    if(req.session.user){
        const username = req.session.user.username;
        const query = 'SELECT nom, prenom, adresse, telephone, mail, role, username FROM membre WHERE username = ?'
        mysql.query(query, [username], (err, results, fields) => {
            //console.log(results);
            if (err) {
                console.error('Erreur lors de la récupération des données :', err);
                return res.status(500).send('Erreur serveur.');
            }

            if (results.length === 0) {
                res.send('Utilisateur non trouvé.');
                return;
            }

            const user = results[0]; // Donnée de l'utilisateur;
            return res.render('edit_profil', {user: results[0]});
        });
    } else{
        res.redirect('/');
    }
})

// Route pour traiter la mise à jour du profil
app.post('/edit_profil', (req, res) => {
    // Récupérer les données du formulaire
    const { nom, prenom, adresse, telephone, mail } = req.body;
    const username = req.session.user.username;

    // Requête SQL pour mettre à jour les données
    const query = `
        UPDATE membre 
        SET nom = ?, prenom = ?, adresse = ?, telephone = ?, mail = ?
        WHERE username = ?
    `;

    // Paramètres pour éviter les injections SQL
    const values = [nom, prenom, adresse, telephone, mail, username];

    // Exécution de la requête
    mysql.query(query, values, (err, result, fields) => {
        if (err) {
            console.error('Erreur lors de la mise à jour du profil :', err);
            return res.status(500).send('Erreur serveur lors de la mise à jour.');
        }

        console.log(`Profil de ${username} mis à jour avec succès.`);
        res.redirect('/dashboard');
    });
});

// Suppression d'un compte
app.get('/delete_account', (req, res) => {
    if (req.session.user) {
        const username = req.session.user.username;
        // Requête SQL pour supprimer le compte
        mysql.query('DELETE FROM membre WHERE username = ?', [username], (err, result, fields) => {
            if (err) {
                console.error('Erreur lors de la mise à jour du profil :', err);
                return res.status(500).send('Erreur serveur lors de la mise à jour.');
            }

            console.log(`Profil de ${username} supprimer avec succès.`);
            console.log(result);
            req.session.destroy(() => {
                res.redirect('/');
            });
        });
    } else {
        res.redirect('/');
    }
})

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