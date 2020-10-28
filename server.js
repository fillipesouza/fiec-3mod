const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const uuid = require('uuid');
const session = require('express-session');

const con = mysql.createConnection( {
    host: 'localhost',
    port: 3308,
    user: 'root',
    password: '1234',
    database: 'rifa'
} )

const app = express();

const sorteados = {};  // dicionario dos sorteados

app.use(cors({
    origin: ["http://localhost:3000", 'http://localhost:38000'],
    credentials: true})
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + '/public'));

app.use(session({
    secret: 'secret',
    resave: true,
    cookie: {
      maxAge: 24 * 60 * 60 * 365 * 1000
    }
  }))

app.post('/usuarios/cadastro', (req,res) => {
    let { email, senha, nome } = req.body;
    const id_usuario = uuid.v4();
    // console.log(email, senha, nome);
    con.query(`INSERT INTO USUARIO (id_usuario, email, senha, nome)
     VALUES ("${id_usuario}", "${email}", "${senha}", "${nome}")`, (err, result) => {
         if(err) throw err;
         res.json('ok');     
     });    
})

app.post('/usuarios/autentica', (req,res, next) => {
    let { email, senha } = req.body;
    con.query(`SELECT id_usuario, is_admin FROM 
       USUARIO WHERE email="${email}" AND senha="${senha}"`, (err, result) => {
         if(err) throw err;
         if( result ){
         const { id_usuario, is_admin } = result[0];
         const sess = req.session;
         sess.idUser = id_usuario;
         if (is_admin) {
             
             sess.isAdmin = 1;
         }
         res.json(id_usuario)
        } else {
            res.status(401).end('Not Authorized');
        }
     });    
})

app.delete('/usuarios', (req,res) => {
    req.session.destroy(() => {
        res.json('ok');
    })
})

app.get('/isAdmin', (req,res,next) => {
    const sess = req.session;
    if( sess.isAdmin ) res.json('Admin');
    else res.json('Plebeu');
})

app.get('/rifas/:id', (req,res) => {
    let id_rifa = req.params.id;
    con.query(`SELECT foto_rifa, nome_rifa  FROM 
       RIFA WHERE id_rifa="${id_rifa}"`, (err, result) => {
         if(err) throw err;
         res.json(result[0]);         
     });

})

app.put('/sorteio/:id', (req,res) => {
    let id_rifa = req.params.id;
    const numero = 8 + Math.ceil(Math.random()*0); // de 1 à 10 para simplificar a amostragem
    console.log(numero + ' foi sorteado')
    con.query(`SELECT id_usuario FROM sorteio where id_rifa=${id_rifa} AND numero=${numero}`, (err, result) => {
        if(err) throw err;
        if(result){
            const id = result[0].id_usuario;
            sorteados[id] = id_rifa;
        }
        res.json(numero);    
    })

})

app.get('/sorteio', (req,res) => {
    const sess = req.session;
    let id_usuario = sess.idUser;
    con.query(`SELECT nome_rifa, foto_rifa FROM sorteio JOIN rifa on sorteio.id_rifa=rifa.id_rifa where id_usuario=${id_usuario}`, (err, result) => {
        if(err) throw err;
        if(result){
            console.log(result);
            res.json(result);
        } else {
            res.status(404).end('Não contemplado');
        }
    })
});

app.post('/rifas', (req,res) => {
    const { id, nome, foto} = req.body;
    const sess = req.session;
    if( sess.isAdmin ){
        con.query(`INSERT INTO RIFA (id_rifa, nome_rifa, foto_rifa)
     VALUES ("${id}", "${nome}", "${foto}")`, (err, result) => {
         if(err) throw err;
         res.json('ok');    
     });
    } else {
        res.status(401).end();
    }
})

app.get('/comprarifa/:idRifa/:numero', (req,res, next) => {
    
    const sess = req.session;
    const idUser = sess.idUser;
    const idRifa = req.params.idRifa;
    const numero = req.params.numero;
    console.log('here');
    console.log(idUser + ' ' + idRifa + ' ' + numero);
    con.query(`INSERT INTO SORTEIO (id_usuario, id_rifa, numero)  
    VALUES ("${idUser}", ${idRifa}, ${numero})`, (err, result) => {
        if(err) throw err;
        res.json('ok');    
    });

})



app.listen(38000, () => {
    console.log('Servidor Ligado');
})