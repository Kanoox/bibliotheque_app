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