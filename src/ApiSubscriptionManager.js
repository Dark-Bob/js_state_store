import global_store from "./GlobalStore.js";

let data_subscription_interval_call_happening = false;
let data_subscription_interval = null;

function _split_path(path) {
    // Remove trialing slashes
    if (path.endsWith('/'))
        path = path.slice(0, -1);
    // See if it's made up of more than on section
    const first_part_index = path.lastIndexOf('/');
    if (first_part_index === -1)
        return [path, null];
    return [path.substring(0, first_part_index), path.substring(first_part_index + 1)];
}


function update_state(new_json, old_json, path) {
    // Handle arrays
    if (Array.isArray(new_json) && Array.isArray(old_json)) {
        // If the old array is empty, just set it t othe new list
        if (old_json.length === 0) {
            global_store.set_json(path, new_json);
            return;
        }

        const array = global_store.get(path);
        // If array is an object map
        if (typeof array === 'object' && 'store' in array) {
            const id_property_name = array.store.id_property_name;
            const existing_keys = old_json.map(object => object[id_property_name]);
            const new_json_keys = new_json.map(object => object[id_property_name]);
            const new_json_filtered = new_json.filter(object => !existing_keys.includes(object[id_property_name]));
            const deleted_keys = existing_keys.filter(key => !new_json_keys.includes(key));
            const existing_objects = new_json.filter(object => existing_keys.includes(object[id_property_name]));

            for (const deleted_key of deleted_keys)
                global_store.delete(`${path}/${new_key[id_property_name]}`)

            for (const new_object_json of new_json_filtered)
                global_store.set_json(`${path}/${new_object_json[id_property_name]}`, new_object_json);

            for (const existing_object of existing_objects) {
                for (const [key, value] of Object.entries(old_item)) {
                    if (!(key in new_item) || JSON.stringify(new_item[key]) !== JSON.stringify(value)) {
                        are_same = false;
                        break;
                    }
                }
            }

            return;
        }

        throw new Error("Not implemented");
    }

    // Handle objects
    if (Object.keys(new_item).length !== Object.keys(old_item).length) {
        are_same = false;
        break;
    }

    for (const [key, value] of Object.entries(old_item)) {
        if (!(key in new_item) || JSON.stringify(new_item[key]) !== JSON.stringify(value)) {
            are_same = false;
            break;
        }
    }
}

function subscribe_to_apis(subscriptions) {
    console.log(`Subscribing to APIs [${subscriptions}]`);
    if (data_subscription_interval !== null)
        clearInterval(data_subscription_interval);

    const subscription_handler = () => {
        if (data_subscription_interval_call_happening)
            return;

        data_subscription_interval_call_happening = true;
        for (const subscription of subscriptions) {
            const url = global_store.get_url(subscription);
            fetch_get_json(url)
                .then(response => {
                    const object_name = _split_path(subscription)[1] || subscription;
                    const new_list = response[object_name];
                    const old_list = global_store.get_json(subscription);
                    let are_same = true;

                    if (new_list.length === old_list.length) {
                        for (let i=0; i<old_list.length && are_same; ++i) {
                            const new_item = new_list[i];
                            const old_item = old_list[i];

                            if (Object.keys(new_item).length !== Object.keys(old_item).length) {
                                are_same = false;
                                break;
                            }
                            for (const [key, value] of Object.entries(old_item)) {
                                if (!(key in new_item) || JSON.stringify(new_item[key]) !== JSON.stringify(value)) {
                                    are_same = false;
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        are_same = false;
                    }

                    if (!are_same) {
                        store.commit(subscription, response[subscription]);
                    }
                })
                .catch(error => console.error(error));
        }

        data_subscription_interval_call_happening = false;
    };
    subscription_handler();
    setInterval(subscription_handler, 2000);
}

class ApiSubscriptionManager {
    constructor() {
        this.subscriptions = [];
    }

    subscribe(store_path) {
        this.subscriptions.push(store_path);
        subscribe_to_apis(this.subscriptions);
    }

    unsubscribe(store_path) {
        this.subscriptions = this.subscriptions.filter(item => item !== store_path);
        subscribe_to_apis(this.subscriptions);
    }
}

const api_subscription_manager = new ApiSubscriptionManager();
export default api_subscription_manager;