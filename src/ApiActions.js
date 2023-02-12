
export const api_actions_object = {
    update(store, state) {
        // We mirror the same path on the API
        const promise = fetch_patch_json(store.get_object_url(), state);
        promise.then(() => {
			for (const [property_name, value] of Object.entries(state))
				store.object[property_name] = value;
		})
        return promise;
    }
};

export function create_api_actions_map(class_, parent_store=null) {
    return {
        add(store, state) {
            // We mirror the same path on the API
            const promise = fetch_post_json(store.get_object_url(), state);
            promise.then((object_json) => {
                const object = class_.create_from_json(object_json, parent_store);
                store.object[object.store.get_id()] = object;
            });
            return promise;
        },
        remove(store, state) {
            // We mirror the same path on the API
            const promise = fetch_delete_json(`${store.get_object_url()}/${state['id']}`);
            promise.then((object_json) => {
                delete store.object[state['id']];
            });
            return promise;
        }
    };
}