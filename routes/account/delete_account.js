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