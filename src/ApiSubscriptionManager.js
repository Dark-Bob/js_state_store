import global_store from "./GlobalStore.js";


const subscription_interval_map = {}

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

function subscription_handler(interval_data) {
    if (interval_data['deleted'] || interval_data['interval_call_happening'])
        return;

    interval_data['interval_call_happening'] = true;
    const store_path = interval_data['store_path'];
    const subscription_data = interval_data['subscription_data']

    const url = subscription_data['url'] || global_store.get_url(store_path);
    if (url == null) {
        console.warn(`Cannot fetch [${store_path}], internal state is not set for this path in the global store.`);
        interval_data['interval_call_happening'] = false;
        return;
    }

    fetch_get_json(url)
        .then(response => {
            if (interval_data['deleted'])
                return;
            let object_json;
            if (subscription_data['get_object_from_response_function']) {
                object_json = subscription_data['get_object_from_response_function'](response);
            }
            else {
                const object_name = _split_path(store_path)[1] || store_path;
                object_json = response[object_name];
            }
            global_store.set_json(store_path, object_json);
        })
        .catch(error => console.error(error));

    interval_data['interval_call_happening'] = false;
}

function subscribe_to_apis(subscriptions) {
    let old_store_paths = Object.keys(subscription_interval_map);
    const subscription_keys = Object.keys(subscriptions);
    old_store_paths = old_store_paths.filter((store_path) => !subscription_keys.includes(store_path));

    console.log(`Subscribing to APIs [${subscription_keys}]`);
    for (const [store_path, subscription_data] of Object.entries(subscriptions)) {
        if (!(store_path in subscription_interval_map)) {
            const interval_data = {
                store_path: store_path,
                subscription_data: subscription_data,
                interval_call_happening: false,
                interval_handle: null,
                deleted: false
            }
            subscription_handler(interval_data);
            interval_data['interval_handle'] = setInterval(() => {
                subscription_handler(interval_data)
            }, subscription_data['poll_frequency']);
            subscription_interval_map[store_path] = interval_data;
        }
    }
    for (const store_path of old_store_paths) {
        subscription_interval_map[store_path]['deleted'] = true;
        clearInterval(subscription_interval_map[store_path]['interval_handle']);
        delete subscription_interval_map[store_path];
    }
}

class ApiSubscriptionManager {
    constructor() {
        this.subscriptions = {};
    }

    subscribe({store_path, get_object_from_response_function=null, url=null, poll_frequency=2000}) {
        if (store_path in this.subscriptions)
            throw new Error(`Already subscribed to [${store_path}]`);
        this.subscriptions[store_path] = {
            get_object_from_response_function: get_object_from_response_function,
            url: url,
            poll_frequency: poll_frequency
        };
        subscribe_to_apis(this.subscriptions);
    }

    unsubscribe(store_path) {
        delete this.subscriptions[store_path];
        subscribe_to_apis(this.subscriptions);
    }
}

const api_subscription_manager = new ApiSubscriptionManager();
export default api_subscription_manager;