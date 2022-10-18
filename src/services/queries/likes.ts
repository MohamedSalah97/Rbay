import { client } from "$services/redis";
import { usersLikesKey, itemsKey } from "$services/keys";
import { deserialize } from "./items";
import { getItems } from "./items";

export const userLikesItem = async (itemId: string, userId: string) => {
    return client.sIsMember(usersLikesKey(userId), itemId);
};

export const likedItems = async (userId: string) => {
    const ids= await client.sMembers(usersLikesKey(userId));

    const commands = ids.map(id=>{
        return client.hGetAll(itemsKey(id));
    });

    const results = await Promise.all(commands);

    return results.map ((result,i) =>{
        if(Object.keys(result).length === 0){
            return null
        }
        return deserialize(ids[i],result);
    })

};

export const likeItem = async (itemId: string, userId: string) => {
    const inserted = await client.sAdd(usersLikesKey(userId), itemId);
    if(inserted){
        await client.hIncrBy(itemsKey(itemId), 'likes' , 1)
    }
};

export const unlikeItem = async (itemId: string, userId: string) => {
    const removed = await client.sRem(usersLikesKey(userId), itemId);

    if(removed){
        return client.hIncrBy(itemsKey(itemId), 'likes' , 1)
    }   
};

export const commonLikedItems = async (userOneId: string, userTwoId: string) => {
    const ids = await client.sInter([usersLikesKey(userOneId), usersLikesKey(userTwoId)]);
    return getItems(ids);
};
