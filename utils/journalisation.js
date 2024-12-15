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