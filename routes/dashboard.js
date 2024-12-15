// Page dashboard, authentication obligatoire
app.get('/dashboard', (req, res) => {
    const username = 'test';
    if (!req.session.user) {
        return res.redirect('/');
    } else {
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