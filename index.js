// Chargement du module http
const http = require('http');
const fs = require("fs");
const path = require('path');
// Definition du port d'écoute
const port = 80;
const host = '146.59.196.41';
/*
    Création du serveur (createServer)
    Fonction qui gère les requetes
 */

//TODO mettre à jour nb_clicks

const server = http.createServer((req, res) => {
    var url = req.url;
    var req_path = decodeURI(url.replace(/^\/+/, "").replace(/\?.*$/, ""));
    res.writeHead(200);

    var params = new URLSearchParams(url.replace(/^.*\?/, ""));
    var searchObj = JSON.parse('{"' + decodeURI(params).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');

    if (req_path === "search") {
        if ('code_postal' in searchObj) {
            let rech = parseInt(searchObj['code_postal']);
            let bdd = getBdd();
            let r = {};
            r.communes = {};
            let found = false;
            try {
                Object.keys(bdd).forEach(k => {
                    let region = bdd[k];
                    Object.keys(region.departements).forEach(kk => {
                        let dept = region.departements[kk];

                        Object.keys(dept.communes).forEach(kkk => {
                            let com = dept.communes[kkk];
                            if (com.code_postal === rech){
                                r.communes[kkk] = com;
                                found = true;
                            }
                        });
                        if (found) {
                            r.region = k;
                            r.departement = kk;
                            res.end(JSON.stringify(r));
                            throw new Error('break');
                        }
                    });
                });
            } catch (e) {
                if (e.message !== 'break') throw e;
            }
            if (!found) {
                res.end("Pas trouvé");
            }
        } else {
            res.end("Pas les bons parametres");
        }
    } else if (req_path === "commune") {
        if ('region' in searchObj && 'departement' in searchObj && 'commune' in searchObj) {
            let bdd = getBdd();
            let r = {};
            let rechReg = searchObj['region'].replaceAll('+', ' ');
            if (rechReg in bdd) {
                let region = bdd[rechReg];
                let rechDep = searchObj['departement'].replaceAll('+', ' ');
                if (rechDep in region.departements) {
                    let dep = region.departements[rechDep];
                    let rechCom = searchObj['commune'].replaceAll('+', ' ');
                    if (rechCom in dep.communes) {
                        let com = dep.communes[rechCom];

                        delete region.departements;
                        delete dep.communes;

                        region.nom_reg = rechReg;
                        dep.nom_dep = rechDep;
                        com.id_com = rechCom;

                        r.region = region;
                        r.departement = dep;
                        r.commune = com;

                        res.end(JSON.stringify(r));
                    } else {
                        res.end("Commune pas trouvé");
                    }
                } else {
                    res.end("Dep pas trouvé");
                }
            } else {
                res.end('Region pas trouvée');
            }
        } else {
            res.end("Pas les bons parametres");
        }
    } else if (req_path === "departements") {
        if ('region' in searchObj) {
            let r = {};
            r.departements = [];
            let bdd = getBdd();
            let nomRegion = searchObj['region'];
            if (nomRegion in bdd) {
                let region = bdd[nomRegion];
                let depts = region.departements;
                Object.keys(depts).forEach(k => {
                    r.departements.push(k);
                });

                r.score_global = region.score_global;
                r.indice_acces_info = region.indice_acces_info;
                r.indice_acces_interf_num = region.indice_acces_interf_num;
                r.indice_competences_admin = region.indice_competences_admin;
                r.indice_competences_num = region.indice_competences_num;

                res.end(JSON.stringify(r));

            } else {
                //TODO msg erreur region non trouvée
            }
        } else {
            //TODO msg erreur pas le bon param
        }
    } else if (req_path === "communes") {
        if ('departement' in searchObj && 'region' in searchObj) {
            let r = {};
            r.communes = {};
            let bdd = getBdd();
            let nomRegion = searchObj['region'];
            let nomDept = searchObj['departement'].replaceAll('+', ' ');
            if (nomRegion in bdd) {
                let region = bdd[nomRegion];
                if (nomDept in region.departements) {
                    let dept = region.departements[nomDept];
                    let comms = dept.communes;
                    Object.keys(comms).forEach(k =>  {
                        r.communes[k] = comms[k].nom_com;
                    });

                    r.score_global = dept.score_global;
                    r.indice_acces_info = dept.indice_acces_info;
                    r.indice_acces_interf_num = dept.indice_acces_interf_num;
                    r.indice_competences_admin = dept.indice_competences_admin;
                    r.indice_competences_num = dept.indice_competences_num;

                    res.end(JSON.stringify(r));
                } else {
                    res.end("Departement pas trouvé.");
                }
            } else {
                res.end("Region pas trouvée.");
            }
        } else {
            res.end("Pas les bons parametres");
        }
    } else if (req_path === "pdf") {
        if ('region' in searchObj && 'departement' in searchObj && 'commune' in searchObj) {

        } else {
            res.end("Pas les bons parametres");
        }
    } else {
        var filePath = '.' + req.url;
        if (filePath == './')
            filePath = './index.html';

        var extname = path.extname(filePath);
        var contentType = 'text/html';
        switch (extname) {
            case '.js':
                contentType = 'text/javascript';
                break;
            case '.css':
                contentType = 'text/css';
                break;
            case '.json':
                contentType = 'application/json';
                break;
            case '.png':
                contentType = 'image/png';
                break;
            case '.jpg':
                contentType = 'image/jpg';
                break;
            case '.wav':
                contentType = 'audio/wav';
                break;
        }

        fs.readFile(filePath, function(error, content) {
            if (error) {
                if(error.code == 'ENOENT'){
                    fs.readFile('./404.html', function(error, content) {
                        res.writeHead(200, { 'Content-Type': contentType });
                        res.end(content, 'utf-8');
                    });
                }
                else {
                    res.writeHead(500);
                    res.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                    res.end();
                }
            }
            else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    }
});

// connection du serveur au port d'ecoute
server.listen(port, host, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

function getBdd() {
    return JSON.parse(fs.readFileSync('bdd.json'));
}