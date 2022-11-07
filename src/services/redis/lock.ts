import {randomBytes} from 'crypto';
import { client } from './client';

export const withLock = async (key: string , cb: (redisClient: Client, signal: any)=> any) => {
	// initialize a few vars to control the retry behavior
	const retryDelayMs = 100;
	let retries = 20;
	const timeoutMs = 2000;
	//generate random value to store at the lock key
	const token = randomBytes(6).toString('hex');
	//create the lock key
	const lockKey = `lock:${key}`
	//set a while loop to implement the retry behavior
	while(retries >= 0){
		retries--;
		// try to do SET NX operation
		const acquired = await client.set(lockKey, token,{
			NX: true,
			PX: timeoutMs
		})
		//else pause and then retry
		if(!acquired){
			await pause(retryDelayMs);
			//go to the next iteration
			continue;
		}
		// if set is successful run the cb
		try {
			const signal = {expired: false}
			setTimeout(()=>{
				signal.expired = true;
			},2000)

			const proxiedClient = buildClientProxy(timeoutMs)
			const results = await cb(proxiedClient,signal);
			return results;
		} finally {
			//unset the locked key
			await client.unlock(lockKey, token);
		}
	}

};

type Client = typeof client ;
const buildClientProxy = (timeoutMs: number) => {
	const startTime = Date.now();

	const handler = {
		get(target: Client , prop: keyof Client){
			if(Date.now() >= startTime + timeoutMs){
				throw new Error("Lock expired");
			}

			const value = target[prop];
			return typeof value === 'function'? value.bind(target): value
		}
	}

	return new Proxy(client, handler) as Client ;
};

const pause = (duration: number) => {
	return new Promise((resolve) => {
		setTimeout(resolve, duration);
	});
};
