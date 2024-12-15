app.get('/edit_profil', (req, res) => {
    const username = req.session.user.username;
    if(req.session.user){
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