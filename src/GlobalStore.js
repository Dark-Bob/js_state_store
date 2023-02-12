import {StoreState, is_store_object} from "./StoreState.js";

class GlobalStore {
    constructor() {
        this.store_map = {};
        this.base_url = ''
    }

    _register_store(property_name, store) {
        // We need directly set and registered store to behave the same way, we create a Store, so we always pass the whole path
        this.store_map[property_name] = new StoreState(property_name, this, false);
        this.store_map[property_name].set(property_name, {store: store});
    }

    clear() {
        for (const property_name of Object.keys(this.store_map))
            delete this.store_map[property_name];
    }

    get_object_path() {
        return '';
    }

    get_object_url() {
        return this.base_url;
    }

    get(path) {
        const path_parts = this._split_path(path);
        if (!(path_parts[0] in this.store_map))
            return null;
        return this.store_map[path_parts[0]].get(path);
    }

    get_json(path) {
        const path_parts = this._split_path(path);
        if (!(path_parts[0] in this.store_map))
            return null;
        return this.store_map[path_parts[0]].get_json(path);
    }

    get_url(path) {
        const path_parts = this._split_path(path);
        if (!(path_parts[0] in this.store_map))
            return null;
        return this.store_map[path_parts[0]].get_url(path);
    }

    set(path, object) {
        const path_parts = this._split_path(path);
        if (!(path_parts[0] in this.store_map)) {
            if (path_parts[1] == null) {
                this.store_map[path_parts[0]] = new StoreState(path_parts[0], this, false);
                this.store_map[path_parts[0]].set(path_parts[0], object);
                return;
            } else
                throw new Error(`Could not find [${path_parts[0]}] in path [${path}]`);
        }
        return this.store_map[path_parts[0]].set(path, object);
    }

    set_json(path, object_json) {
        const path_parts = this._split_path(path);
        if (!(path_parts[0] in this.store_map)) {
            if (path_parts[1] == null) {
                this.store_map[path_parts[0]] = new StoreState(path_parts[0], this, false);
                this.store_map[path_parts[0]].set_json(path_parts[0], object_json);
                return;
            } else
                throw new Error(`Could not find [${path_parts[0]}] in path [${path}]`);
        }
        return this.store_map[path_parts[0]].set_json(path, object_json);
    }

    add(path, object) {
        if (!is_store_object(object))
            throw new Error('The add function is reserved for adding objects to object maps')
        if (path.slice(-1) === '/')
            this.set(`${path}${object.store.get_id()}`, object);
        else
            this.set(`${path}/${object.store.get_id()}`, object);
    }

    subscribe(path, callback) {
        const path_parts = this._split_path(path);
        if (!(path_parts[0] in this.store_map))
            throw new Error(`Could not find [${path_parts[0]}] in path [${path}]`);
        return this.store_map[path_parts[0]].subscribe(path, callback);
    }

    action(action, path, state) {
        const path_parts = this._split_path(path);
        if (!(path_parts[0] in this.store_map))
            throw new Error(`Could not find [${path_parts[0]}] in path [${path}]`);
        return this.store_map[path_parts[0]].action(action, path, state);
    }

    set_object_map(property_name, object_list, query_string=null, actions={}, on_change_callback=null) {
        this.store_map[property_name] = new StoreState(property_name, this, false);
        return this.store_map[property_name].set_object_map(property_name, object_list, query_string, actions, on_change_callback);
    }

    set_base_url(base_url) {
        this.base_url = base_url;
    }

    _split_path(path) {
        // Remove trialing slashes
        if (path.endsWith('/'))
            path = path.slice(0, -1);
        // See if it's made up of more than on section
        const first_part_index = path.indexOf('/');
        if (first_part_index === -1)
            return [path, null];
        return [path.substring(0, first_part_index), path.substring(first_part_index + 1)];
    }
}

const global_store = new GlobalStore();
export default global_store;