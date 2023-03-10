import global_store from "./GlobalStore.js";

let data_subscription_interval_call_happening = false;
let data_subscription_interval = null;

function _split_path(path) {
    // Remove trialing slashes
    if (path.startsWith('/'))
        path = path.slice(1);
    if (path.endsWith('/'))
        path = path.slice(0, -1);
    // See if it's made up of more than on section
    const first_part_index = path.lastIndexOf('/');
    if (first_part_index === -1)
        return [path, null];
    return [path.substring(0, first_part_index), path.substring(first_part_index + 1)];
}

function subscribe_to_apis(subscriptions) {
    console.log(`Subscribing to APIs [${Object.keys(subscriptions)}]`);
    if (data_subscription_interval !== null)
        clearInterval(data_subscription_interval);

    const subscription_handler = () => {
        if (data_subscription_interval_call_happening)
            return;

        data_subscription_interval_call_happening = true;
        for (const [store_path, subscription_data] of Object.entries(subscriptions)) {
            const url = global_store.get_url(store_path);
            if (url == null) {
                console.warn(`Cannot fetch [${store_path}], internal state is not set for this path in the global store.`);
                continue;
            }
            fetch_get_json(url)
                .then(response => {
                    let object_name;
                    if (subscription_data['returned_object_name'] != null)
                        object_name = subscription_data['returned_object_name'];
                    else
                        object_name = _split_path(store_path)[1] || store_path;
                    const new_list = response[object_name];
                    global_store.set_json(store_path, new_list);
                })
                .catch(error => console.error(error));
        }

        data_subscription_interval_call_happening = false;
    };
    subscription_handler();
    data_subscription_interval = setInterval(subscription_handler, 2000);
}

class ApiSubscriptionManager {
    constructor() {
        this.subscriptions = [];
    }

    subscribe(store_path, returned_object_name=null) {
        if (store_path in this.subscriptions)
            throw new Error(`Already subscribed to [${store_path}]`);
        this.subscriptions[store_path] = {returned_object_name: returned_object_name};
        subscribe_to_apis(this.subscriptions);
    }

    unsubscribe(store_path) {
        delete this.subscriptions[store_path];
        subscribe_to_apis(this.subscriptions);
    }
}

const api_subscription_manager = new ApiSubscriptionManager();
export default api_subscription_manager;