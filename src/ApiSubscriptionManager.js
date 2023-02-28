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
                    global_store.set_json(subscription, new_list);
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