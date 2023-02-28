
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

export const create_api_actions_map = {
    add(store, state) {
        const [create_from_json_function, id_property_name] = global_store.get_create_from_json_function(store.get_object_path());
        // We mirror the same path on the API
        const promise = fetch_post_json(store.get_object_url(), state);
        promise.then((object_json) => {
            const object = create_from_json_function(object_json, `${store.get_object_path()}/${object_json[id_property_name]}`);
            store.object[object.store.get_id()] = object;
        });
        return promise;
    },
    remove(store, state) {
        const [create_from_json_function, id_property_name] = global_store.get_create_from_json_function(store.get_object_path());
        // We mirror the same path on the API
        const promise = fetch_delete_json(`${store.get_object_url()}/${state[id_property_name]}`);
        promise.then((object_json) => {
            delete store.object[state[id_property_name]];
        });
        return promise;
    }
};