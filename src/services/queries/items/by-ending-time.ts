import { client } from "$services/redis";
import {itemsKey ,itemsByEndingAt } from "$services/keys";
import { deserialize } from "./deserialize";

export const itemsByEndingTime = async (
	order: 'DESC' | 'ASC' = 'DESC',
	offset = 0,
	count = 10
) => {
	await client.zRange(itemsByEndingAt(),
		Date.now(), 
		'+inf',{
			BY: 'SCORE',
			LIMIT:{
				offset,
				count
			}
		}
	)
};
