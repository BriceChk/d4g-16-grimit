// Chargement du module http
const http = require('http');
// Definition du port d'écoute
const port = 80;
/*
    Création du serveur (createServer)
    Fonction qui gère les requetes
 */

const server = http.createServer((req, res) => {
    //Réponse du serveur
    res.end('Mon premier serveur nodejs!!!');
});

// connection du serveur au port d'ecoute
server.listen(port, (err) => {
    //check si il y'a pas une erreur pendant le lancement du serveur
    if (err) {
        //Afficher l'erreur survenue pendant le lancement
        return console.log('Erreur: ', err)
    }
    // Afficher l'adresse sur serveur
    console.log(`Serveur: localhost:${port}`)
});