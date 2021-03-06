const { nanoid } = require('nanoid');
const auth = require('../auth');

const TABLE = 'user';

module.exports = function (injected_store, injected_cache) {
    let cache = injected_cache;
    let store = injected_store;
    if (!store) {
        store = require('../../../store/dummy');
    }
    if (!cache) {
        cache = require('../../../store/dummy');
    }

    async function list () {
        let users = await cache.list(TABLE);

        if (!users) {
            console.log('Wasn\'t in cache. Searched in DB.');
            users = await store.list(TABLE);
            cache.upsert(TABLE, users);
        } else {
            console.log('Found in cache.');
        }

        return users;
    }

    function get (id) {
        return store.get(TABLE, id);
    }

    async function upsert (body) {
        const user = {
            name: body.name,
            username: body.username,
        }

        if (body.id) {
            user.id = body.id;
        } else {
            user.id = nanoid();
        }

        if (body.password || body.username) {
            await auth.upsert({
                id: user.id,
                username: user.username,
                password: body.password,
            })
        }

        return store.upsert(TABLE, user);
    }

    function remove (body) {
        return store.remove(TABLE, body.id);
    }

    const follow = (user_from, user_to) => {
        return store.upsert(`${TABLE}_follow`, {
            user_from,
            user_to
        });
    }

    const followers = async(user_from) => {
        const join = {};
        join[TABLE] = 'user_from';
        const query = {user_to: user_from};

        return await store.query(`${TABLE}_follow`, query, join);
    }

    const following = async (user) => {
        const join = {};
        join[TABLE] = 'user_to';
        const query = { user_from: user };

        return await store.query(`${TABLE}_follow`, query, join)
    }

    return {
        list,
        get,
        upsert,
        remove,
        follow,
        followers,
        following,
    };

}