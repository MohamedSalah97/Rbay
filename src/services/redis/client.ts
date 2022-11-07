import { createClient, defineScript } from 'redis';
import { itemsByViewsKey,itemsKey, itemsViewsKey } from "$services/keys";
import { createIndexes } from './create-indexes';


const client = createClient({
	socket: {
		host: process.env.REDIS_HOST,
		port: parseInt(process.env.REDIS_PORT)
	},
	password: process.env.REDIS_PW,
	scripts:{
		addOneAndStore: defineScript({
			NUMBER_OF_KEYS: 1,
			SCRIPT: `
				return redis.call('SET',KETS[1], 1+ tonumber(ARGV[1]))
			`,
			transformArguments(key: string, value: number){
				return [key, value.toString()]
			},
			transformReply(reply: any){
				return reply
			}
		}),
		incrementView: defineScript({
			NUMBER_OF_KEYS: 3,
			SCRIPT: `
				local itemsViewsKey = KEYS[1]
				local itemsKey = KEYS[2]
				local itemsByViewsKey = KEYS[3]
				local itemId = ARGV[1]
				local userId = ARGV[2]

				local inserted = redis.call('PFADD', itemsViewsKey,userId)
				if inserted == 1 then
					redis.call('HINCRBY', itemsKey, 'views', 1)
					redis.call('ZINCRBY', itemsByViewsKey , 1 , itemId)
				end
			`,
			transformArguments(itemId: string, userId: string){
				return [itemsViewsKey(itemId),itemsKey(itemId),itemsByViewsKey(),itemId, userId ];
				// this will be EVALSHA <SCRIPTID> 3 firstkey secondkey third firstargument secondargument
			},
			transformReply(){
				// this if i have any data back from redis i can deserialize it in this function
			}
		}),
		unlock: defineScript({
			NUMBER_OF_KEYS: 1,
			SCRIPT:`
				if redis.call('GET', KEYS[1]) == ARGV[1] then
					return redis.call('DEL', KEYS[1])
				end
			`, 
			transformArguments(key, token){
				return [key, token]
			},
			transformReply(){}
		})
	}
});

client.on('error', (err) => console.error(err));
client.connect();
client.on('connect', async () =>{
	try {
		await createIndexes() ;
	} catch (error) {
		console.error(error);
	}
});

export { client };
