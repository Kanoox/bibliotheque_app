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