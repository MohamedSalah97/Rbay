import type { CreateBidAttrs, Bid } from '$services/types';
import { bidHistoryKey, itemsKey,itemsByPriceKey } from '$services/keys';
import { client ,withLock} from '$services/redis';
import { DateTime } from 'luxon';
import { getItem } from './items';

export const createBid = async (attrs: CreateBidAttrs) => {

	return withLock(attrs.itemId, async(lockedClient: typeof client,signal: any)=>{
		const item = await getItem(attrs.itemId);
		if(!item){
			throw new Error('item is not found');
		}
		if( item.price >= attrs.amount){
			throw new Error('bid is low')
		}
		if(item.endingAt.diff(DateTime.now()).toMillis() < 0){
			throw new Error('item closed for bidding');
		}
		const serialized = serializeHistory(attrs.amount, attrs.createdAt.toMillis());

		if(signal.expired){
			throw new Error('Lock Expired');
		}

		//queuing queries in transaction
		return Promise.all([
			lockedClient.rPush(bidHistoryKey(attrs.itemId), serialized),
			lockedClient.hSet(itemsKey(item.id),{
				bids: item.bids + 1,
				price: attrs.amount,
				highestBidUserId: attrs.userId
			}),
			lockedClient.zAdd(itemsByPriceKey(),{
				value: item.id,
				score: attrs.amount
			})
		])
	})

	// this is a transactional way to do it
	// return client.executeIsolated(async(isolatedClient) =>{
	// 	// making that isolated client in watch mode for taht key
	// 	await isolatedClient.watch(itemsKey(attrs.itemId));
	// 	const item = await getItem(attrs.itemId);
	// 	if(!item){
	// 		throw new Error('item is not found');
	// 	}
	// 	if( item.price >= attrs.amount){
	// 		throw new Error('bid is low')
	// 	}
	// 	if(item.endingAt.diff(DateTime.now()).toMillis() < 0){
	// 		throw new Error('item closed for bidding');
	// 	}
	// 	const serialized = serializeHistory(attrs.amount, attrs.createdAt.toMillis());
	// 	//queuing queries in transaction
	// 	return isolatedClient.multi()
	// 		.rPush(bidHistoryKey(attrs.itemId), serialized)
	// 		.hSet(itemsKey(item.id),{
	// 			bids: item.bids + 1,
	// 			price: attrs.amount,
	// 			highestBidUserId: attrs.userId
	// 		})
	// 		.zAdd(itemsByPriceKey(),{
	// 			value: item.id,
	// 			score: attrs.amount
	// 		})
	// 		//excute this queries
	// 		.exec()
	// });
};

export const getBidHistory = async (itemId: string, offset = 0, count = 10): Promise<Bid[]> => {
	const startIndex = -1 * offset - count ;
	const endIndex = -1 - offset ;

	const range = await client.lRange(bidHistoryKey(itemId), startIndex ,endIndex);

	return range.map(bid => deserializeHistory(bid));
};
 
const serializeHistory = (amount: number , createdAt: number) =>{
	return `${amount}:${createdAt}`;
};

const deserializeHistory = (stored: string) =>{
	const [amount , createdAt] = stored.split(':');

	return{
		amount: parseFloat(amount),
		createdAt: DateTime.fromMillis(parseInt(createdAt))
	}
}