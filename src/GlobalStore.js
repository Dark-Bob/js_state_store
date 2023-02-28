import {StoreState, is_store_object} from "./StoreState.js";


class GlobalStore extends StoreState {
    constructor() {
        super('');
        this.base_url = '';
        this.awaiting_parent_store = {};
        this.create_from_json_functions = {};
    }

    _register_store(property_name, store) {
        if (!(property_name in this.state))
            this.set(property_name,  store.object);
    }

    clear() {
        for (const property_name of Object.keys(this.state))
            delete this.state[property_name];
    }

    get_object_url() {
        return this.base_url;
    }

    get(path, throw_not_found=true, reconcile_stores=true, raw_object=false) {
        if (reconcile_stores)
            this._reconcile_stores();
        return super.get(path, throw_not_found, raw_object);
    }

    get_json(path) {
        this._reconcile_stores();
        return super.get_json(path);
    }

    get_url(path) {
        this._reconcile_stores();
        return super.get_url(path);
    }

    set(path, object) {
        this._reconcile_stores();
        return super.set(path, object);
    }

    set_json(path, object_json) {
        this._reconcile_stores();
        return super.set_json(path, object_json);
    }

    set_object_map(property_name, object_list, query_string=null, actions={}, on_change_callback=null) {
        this._reconcile_stores();
        if (property_name.indexOf('/') === -1)
            this.state[property_name] = null;
        return super.set_object_map(property_name, object_list, query_string, actions, on_change_callback);
    }

    register_create_from_json_function(path_regex, create_from_json_function, id_property_name=null) {
        this.create_from_json_functions[path_regex] = [create_from_json_function, id_property_name];
    }

    _get_create_from_json_function(path) {
        for (const [path_regex, create_from_json_function] of Object.entries(this.create_from_json_functions)) {
            if (new RegExp(path_regex).exec(path) != null)
                return create_from_json_function;
        }
        throw new Error(`No create_from_json function found for path [${path}] use global_store.register_create_from_json_function to register a create function.`);
    }

    subscribe(path, callback) {
        this._reconcile_stores();
        return super.subscribe(path, callback);
    }

    action(action, path, state) {
        this._reconcile_stores();
        return super.action(action, path, state);
    }

    set_base_url(base_url) {
        this.base_url = base_url;
    }

    _awaiting_parent_store(path, store) {
        if (!(path in this.awaiting_parent_store))
            this.awaiting_parent_store[path] = [];
        this.awaiting_parent_store[path].push(store);
    }

    _reconcile_stores() {
        for (const [path, store_list] of Object.entries(this.awaiting_parent_store)) {
            const parent = this.get(path, false, false, true);
            if (parent != null) {
                for (const store of store_list) {
                    if (!('store' in parent) || !(parent.store instanceof StoreState)) {
                        this.get(path, false, false, true);
                        throw new Error('parent.store must be of type store');
                    }
                    store.parent_store = parent.store;
                }
                this.awaiting_parent_store[path] = []
            }
        }
    }
}

const global_store = new GlobalStore();
export default global_store;
window.global_store = global_store;