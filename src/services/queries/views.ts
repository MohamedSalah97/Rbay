import { client } from "$services/redis";

export const incrementView = async (itemId: string, userId: string) => {
    //using LUA scripts to make one redis trip instead of those
    // const inserted = await client.pfAdd(itemsViewsKey(itemId), userId);

    // if(inserted){
    //     return Promise.all([
    //         client.hIncrBy(itemsKey(itemId), 'views', 1),
    //         client.zIncrBy(itemsByViewsKey(), 1, itemId)
    //     ])
    // }
    // go to client.ts to see the script

    return client.incrementView(itemId,userId);
};
