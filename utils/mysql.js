const mysql = require('mysql2'); // Connexion mysql

function getConnection(username, password, database, host){
    // Créer la connexion à la base de données
    const connection = mysql.createConnection({
      host: host,
      user: username,
      password: password,
      database: database,
    });
    return connection;
}

module.exports = getConnection;