const keys = require('./keys');

// express application setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors);
app.use(bodyParser.json());

//postgres client setup
const { Pool } = require('pg');
const pgClient = new Pool({
    user: keys.pgUser,
    password: keys.pgPassword,
    host: keys.pgHost,
    port: keys.pgPort,
    database: keys.pgDatabase
});
pgClient.on('error', () => console.error('Lost postgres connection'));
pgClient
    .query('CREATE TABLE IF NOT EXISTS values(number INT)')
    .catch((err) => console.error(err));

//redis client and publisher
const redis = require('redis');
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});
const redisPublisher = redisClient.duplicate();

// express route handlers
app.get('/', (req, res) => {
    res.send('Hi');
});

app.get('/values/all', async (req, res) => {
    const values = await pgClient.query('SELECT * FROM VALUES;');
    res.send(values.rows);
});

app.get('/values/current', async (req, res) => {
    redisClient.hgetall('values', (err, values) => {
        res.send(values);
    })
});

app.post('/values', async (req, res) => {
    const index = parseInt(req.body.index);
    if (index > 40) {
        res.status(422).send('Index value too high! Maximum value allowed is 40.');
    }
    redisClient.hset('values', index, 'nothing yet...');
    redisPublisher.publish('insert', index);
    pgClient.query('INSERT INTO VALUES(numer) VALUES($1)', [index]);
    res.send({ working: true });
});

app.listen(5000, () => {
    console.log('listening');
});