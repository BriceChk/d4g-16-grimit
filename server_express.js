const express = require('express');
const app = express();
const fs = require("fs");
const pdf = require("pdf-creator-node");
const compression = require('compression');

const port = 80;
app.use(compression());
app.use(express.static('public'));

// respond with "hello world" when a GET request is made to the homepage
app.get('/search', function(req, res) {
    if (req.query.code_postal !== '') {
        let rech = parseInt(req.query.code_postal);
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
                        region.departements = Object.keys(region.departements);
                        region.nom_reg = k;
                        r.region = region;
                        delete dept.communes;
                        dept.nom_dep = kk;
                        r.departement = dept;
                        res.send(JSON.stringify(r));
                        throw new Error('break');
                    }
                });
            });
        } catch (e) {

        }
        if (!found) {
            res.send("Pas trouvé");
        }
    } else {
        res.send('Mauvais parametres.');
    }
});

app.get('/commune', function(req, res) {
    if (req.query.region !== '' && req.query.departement !== '' && req.query.commune !== '') {
        let bdd = getBdd();
        let r = {};
        let rechReg = req.query.region.replaceAll('+', ' ');
        if (rechReg in bdd) {
            let region = bdd[rechReg];
            let rechDep = req.query.departement.replaceAll('+', ' ');
            if (rechDep in region.departements) {
                let dep = region.departements[rechDep];
                let rechCom = req.query.commune.replaceAll('+', ' ');
                if (rechCom in dep.communes) {
                    let com = dep.communes[rechCom];
                    region.departements = Object.keys(region.departements);
                    delete dep.communes;

                    region.nom_reg = rechReg;
                    dep.nom_dep = rechDep;
                    com.id_com = rechCom;

                    r.region = region;
                    r.departement = dep;
                    r.commune = com;

                    res.send(JSON.stringify(r));

                    let b = getBdd();
                    b[rechReg]['departements'][rechDep]['communes'][rechCom].nb_clicks++;
                    fs.writeFileSync('bdd.json', JSON.stringify(b, null, 0));
                } else {
                    res.send("Commune pas trouvé");
                }
            } else {
                res.send("Dep pas trouvé");
            }
        } else {
            res.send('Region pas trouvée');
        }
    } else {
        res.send('Mauvais parametres.');
    }
});

app.get('/departements', function(req, res) {
    if (req.query.region !== '') {
        let r = {};
        r.departements = [];
        let bdd = getBdd();
        let nomRegion = req.query.region.replaceAll('+', ' ');
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

            res.send(JSON.stringify(r));

        } else {
            res.send('Région non trouvée.');
        }
    } else {
        res.send('Mauvais parametres.');
    }
});

app.get('/communes', function(req, res) {
    if (req.query.departement !== '' && req.query.region !== '') {
        let r = {};
        r.communes = {};
        let bdd = getBdd();
        let nomRegion = req.query.region.replaceAll('+', ' ');
        let nomDept = req.query.departement.replaceAll('+', ' ');
        if (nomRegion in bdd) {
            let region = bdd[nomRegion];
            if (nomDept in region.departements) {
                let dept = region.departements[nomDept];
                let comms = dept.communes;
                Object.keys(comms).forEach(k =>  {
                    r.communes[k] = comms[k].nom_com + ' (' + comms[k].nom_iris + ')';
                });

                r.score_global = dept.score_global;
                r.indice_acces_info = dept.indice_acces_info;
                r.indice_acces_interf_num = dept.indice_acces_interf_num;
                r.indice_competences_admin = dept.indice_competences_admin;
                r.indice_competences_num = dept.indice_competences_num;

                res.send(JSON.stringify(r));
            } else {
                res.send("Departement pas trouvé.");
            }
        } else {
            res.send("Region pas trouvée.");
        }
    } else {
        res.send('Mauvais parametres.');
    }
});

app.get('/pdf', function(req, res) {
    if (req.query.region !== '' && req.query.departement !== '' && req.query.commune !== '') {
        let bdd = getBdd();
        let rechReg = req.query.region.replaceAll('+', ' ');
        if (rechReg in bdd) {
            let region = bdd[rechReg];
            let rechDep = req.query.departement.replaceAll('+', ' ');
            if (rechDep in region.departements) {
                let dep = region.departements[rechDep];
                let rechCom = req.query.commune.replaceAll('+', ' ');
                if (rechCom in dep.communes) {
                    let com = dep.communes[rechCom];
                    let html = fs.readFileSync('pdf.html', 'utf8');

                    let options = {
                        format: "A4",
                        orientation: "portrait",
                        border: "10mm"
                    };

                    let phrase = "Ce score est parmi les plus faibles du pays.";
                    let s = com.score_global;
                    if (s >= 210) {
                        phrase = "Ce score est parmi les plus élevés du pays.";
                    } else if (s >= 140) {
                        phrase = "Ce score est situé dans la moitié supérieure nationale.";
                    } else if (s >= 70) {
                        phrase = "Ce score est situé dans la moitié inférieure nationale.";
                    }

                    let donnees = {
                        nom_C: com.nom_com + ' (' + com.nom_iris + ')',
                        sg_C: com.score_global,
                        iainf_C: com.indice_acces_info,
                        iainum_C: com.indice_acces_interf_num,
                        icadm_C: com.indice_competences_admin,
                        icnum_C: com.indice_competences_num,
                        phrase: phrase,
                        nom_D: rechDep,
                        sg_D: dep.score_global,
                        iainf_D: dep.indice_acces_info,
                        iainum_D: dep.indice_acces_interf_num,
                        icadm_D: dep.indice_competences_admin,
                        icnum_D: dep.indice_competences_num,
                        nom_R: rechReg,
                        sg_R: region.score_global,
                        iainf_R: region.indice_acces_info,
                        iainum_R: region.indice_acces_interf_num,
                        icadm_R: region.indice_competences_admin,
                        icnum_R: region.indice_competences_num
                    };

                    let document = {
                        html: html,
                        data: {
                            d: donnees,
                        },
                        path: "./DigitalFragilityIndex.pdf"
                    };

                    pdf.create(document, options)
                        .then(r => {
                            res.sendFile('/var/www/html/DigitalFragilityIndex.pdf',  function (err) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    fs.unlinkSync('./DigitalFragilityIndex.pdf');
                                }
                            });
                        })
                        .catch(error => {
                            console.error(error);
                            res.end("Erreur pdf");
                        });
                } else {
                    res.end("Commune pas trouvé");
                }
            } else {
                res.end("Dep pas trouvé");
            }
        } else {
            res.end('Region pas trouvée');
        }
    }
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

function getBdd() {
    return JSON.parse(fs.readFileSync('bdd.json'));
}