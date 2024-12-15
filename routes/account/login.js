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
                return res.redirect('/bibliotheque');
            } else {
                res.status(401).send('Informations d’identification non valides');
            }
        } catch (err) {
            console.error('Erreur lors de la comparaison des mots de passe', err.message);
            res.status(500).send('Erreur serveur');
        }
    });
});