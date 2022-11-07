export const pagecache = (id: string):string => `pagecache#${id}` ;
export const usersKey = (userId: string) => `users#${userId}`;
export const sessionsKey = (sessionId: string) => `sessions#${sessionId}`;
export const usernamesUniqueKey = () =>'usernames:unique'
export const usersLikesKey = (userId: string) => `users:likes#${userId}`;
export const usernamesKey = () => 'usernames';

//items
export const itemsKey = (itemId:string) => `items#${itemId}`;
export const itemsByViewsKey = () => 'item:views';
export const itemsByEndingAt = () =>'items:endingAt';
export const itemsViewsKey = (itemId: string) => `items:views#${itemId}`;
export const bidHistoryKey = (itemId: string) => `histoy#${itemId}`;
export const itemsByPriceKey = () => `items:price`;
export const  itemsIndexKey = () => `idx:items`; 