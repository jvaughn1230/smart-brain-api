const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const knex = require('knex');
const res = require('express/lib/response');
const { reset } = require('nodemon');

const db = knex({
    client: 'pg',
    connection: {
        host : '127.0.0.1',
        //port : 2345,
        user : 'postgres',
        password :'M@r00516',
        database : 'smart-brain'
        }
    });

const saltRounds = 10;

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res)=>{
    res.send('success');
});

app.post('/signin', (req, res) => {
    db.select('email', 'hash').from('login')
    .where('email', '=', req.body.email)
    .then(data => {
        const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
        if (isValid){
            return db.select('*').from('users')
            .where('email', '=', req.body.email)
            .then(user => {
                res.json(user[0])   
            })
            .catch(err => res.status(400).json('unable to get user'))
        } else{
             res.status(400).json('wrong credentials') 
        }
    })
    .catch(err => res.status(400).json('wrong credentials'))
});

app.post('/register', (req, res)=>{
    const { email, name, password } = req.body;
    const hash = bcrypt.hashSync(password, saltRounds);
    db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
            return trx('users')
            .returning('*')
            .insert({
                email: loginEmail[0].email,
                name: name,
                joined: new Date()
            })
            .then(user => {
                res.json(user[0]);
            })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
        
            .catch(err => res.status(400).json('unable to register'));

    database.users.push({
        id: '125',
        name: name,
        email: email,
        entries: 0,
        joined: new Date(),
    });
});

app.get('/profile/:id', (req, res)=>{
    const { id } = req.params;
    db.select('*').from('users').where({id})
    .then(user => {
        if (user.length){
          res.json(user[0])  
        } else {
            res.status(400).json('Not Found')
        }    
    })
    .catch(err=> res.status(400).json('error getting user'))
});

app.put('/image', (req, res) => {
    const { id } = req.body;
    db('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries => {
        res.json(entries[0].entries);
    })
    .catch(err => res.status(400).json('unable to get entries'))
});


app.listen(3000, ()=>{
    console.log("App is running on port 3000");
});
