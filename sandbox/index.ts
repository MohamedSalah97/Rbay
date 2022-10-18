import 'dotenv/config';
import { client } from '../src/services/redis';

const run = async () => {
    await client.HSET('car1', {
        car: 'toyota',
        year: 2020
    })
    await client.HSET('car2', {
        car: 'toyota',
        year: 2021
    })
    await client.HSET('car3', {
        car: 'toyota',
        year: 2022
    })

    const results = await Promise.all([
        client.hGetAll('car1'),
        client.hGetAll('car2'),
        client.hGetAll('car3')
    ])

    console.log(results);
};
run();
