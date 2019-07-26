const keys = require('./keys');
const redis = require('redis')

const redisClient = redis.createClient({
    host: keys.redisHost,
    host: keys.redisPotr,
    retry_strategy: () => 1000
});

const subscription = redisClient.duplicate();

function fib(index) {
    if (index < 2)
        return index;
    return fib(index - 1) + fib(index - 2);
}

subscription.on('message', (channel, message) => {
    redisClient.hset('values', message, fib(parseInt(message)));
});
subscription.subscribe('insert');