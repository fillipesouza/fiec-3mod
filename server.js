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
         console.log(result[0])
         const { id_usuario, is_admin } = result[0];
         if (is_admin) {
             const sess = req.session;
             sess.isAdmin = 1;
         }
         res.json(id_usuario)
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
    res.json('Plebeu');
})

app.get('/rifas/:id', (req,res) => {
    let id_rifa = req.params.id;
    con.query(`SELECT foto_rifa, nome_rifa  FROM 
       RIFA WHERE id_rifa="${id_rifa}"`, (err, result) => {
         if(err) throw err;
         res.json(result[0]);         
     });

})

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


app.listen(38000, () => {
    console.log('Servidor Ligado');
})