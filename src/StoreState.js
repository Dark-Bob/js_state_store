

function is_called_from_function(function_name) {
    return new Error().stack.includes(function_name);
}

export function is_store_object(object) {
    return object != null && typeof object === 'object' && 'store' in object && object.store instanceof StoreState;
}

export class StoreMap extends Map {
    constructor() {
        super();
    }

    values() {
        return Object.values(this);
    }
}

class StoreMapProxy {

    static proxy_properties = ['subscribe', 'subscriptions', 'action', 'actions', 'store', 'to_json', 'update_from_json'];
    static create_from_object(object, path, actions={}) {
        const proxy_handler = new StoreMapProxy(object, path, actions);
        const proxy = new Proxy(object, proxy_handler);
        proxy_handler.store.object = proxy;
        return proxy;
    }

    constructor(object, path, actions) {
        this.object = object;
        this.actions = actions;
        this.action = this.action.bind(this);
        this.subscribe = this.subscribe.bind(this);

        // Needs to happen after members are set up
        this.store = new StoreState(path, object);
    }

    subscribe(callback) {
        this.store.object_subscriptions.push(callback);
        return true;
    }

    action(action, state) {
        if (!(action in this.actions))
            throw new Error(`Action [${action}] not found among the actions [${Object.keys(this.actions)}]`);
        this.actions[action](this.store, state);
    }

    has(target, property_name) {
        if (StoreMapProxy.proxy_properties.includes(property_name))
            return true;
        return Reflect.has(target, property_name);
    }

    get(target, property_name) {
        if (StoreMapProxy.proxy_properties.includes(property_name))
             return this[property_name];
        if (property_name === 'length')
            return target.values().length;
        return Reflect.get(...arguments);
    }

    set(target, property_name, value, receiver) {
        if (property_name === 'subscriptions')
             return this.subscriptions = value;
        if (!Object.prototype.hasOwnProperty.call(target, property_name))
            return Reflect.set(...arguments);
        if (!('store' in value) || !(value.store instanceof StoreState))
            throw new Error(`Cannot set property [${property_name}] to an object that does not contain a [store] property of type [Store].`);
        if (this.length > 0) {
            const current_object_name = Object.values(target)[0].store.object_name;
            if (value.store.object_name !== current_object_name)
                throw new Error(`New value object_name [${value.store.object_name}], is not the same as this list [${current_object_name}]`);
        }
        if (this.store.object_subscriptions.length > 0) {
            const values = target.values();
            for (const callback of this.store.object_subscriptions) {
                try {
                    callback(values, property_name, target[property_name], value, 'change');
                } catch (exception)
                {
                    console.error(exception, exception.stack);
                }
            }
        }
        return Reflect.set(...arguments);
    }

    defineProperty(target, property_name, descriptor) {
        const value = descriptor['value'];
        if (Object.prototype.hasOwnProperty.call(target, property_name))
            return Reflect.defineProperty(...arguments);
        if (this.store.object_subscriptions.length > 0) {
            const values = target.values();
            for (const callback of this.store.object_subscriptions) {
                try {
                    callback(values, property_name, target[property_name], value, 'add');
                } catch (exception)
                {
                    console.error(exception, exception.stack);
                }
            }
        }
        const original_values = this.object.values();
        const return_value = Reflect.defineProperty(target, property_name, descriptor);
        if (!is_called_from_function('_create_object_map')) {
            for (const callback of this.store.object_subscriptions) {
                try {
                    callback(this, this.store.object_name, original_values, this.object.values(), 'change');
                } catch (exception) {
                    console.error(exception, exception.stack);
                }
            }
        }
        return return_value;
    }

    deleteProperty(target, property_name) {
        if (this.store.object_subscriptions.length > 0) {
            const values = target.values();
            for (const callback of this.store.object_subscriptions) {
                try {
                    callback(values, property_name, target[property_name], undefined, 'remove');
                } catch (exception)
                {
                    console.error(exception, exception.stack);
                }
            }
        }
        const original_values = this.object.values();
        const return_value = Reflect.deleteProperty(target, property_name);
        if (!is_called_from_function('_create_object_map')) {
            for (const callback of this.store.object_subscriptions) {
                try {
                    callback(this, this.store.object_name, original_values, this.object.values(), 'change');
                } catch (exception) {
                    console.error(exception, exception.stack);
                }
            }
        }
        return return_value;
    }

    update_from_json(object_json) {
        const original_keys = Object.keys(this);
        const [create_from_json_function, id_property_name] = global_store.get_create_from_json_function(this.store.get_object_path());
        const object_list = [];
        for (let i=0; i<object_json.length; ++i) {
            const object_json_ = object_json[i];
            const id = object_json_[id_property_name];

            if (id_property_name != null) {
                if (object_json_[id_property_name] in this) {
                    const object = this[object_json_[id_property_name]];

                    if (is_store_object(object)) {
                        if ('update_from_json' in object)
                            object.update_from_json(object_json_);
                        else
                            object.store.update_from_json(object_json_);
                    } else if (object_json_ !== object)
                        this.set(id, object_json_[id]);

                    object_list.push(this[id]);
                    continue;
                }
            }

            const object = create_from_json_function(object_json_, `${this.store.get_object_path()}/${id}`);
            object.store.update_from_json(object_json_);
            object_list.push(object);

            if (this.store.object_subscriptions.length > 0) {
                const values = this.values();
                for (const callback of this.store.object_subscriptions) {
                    try {
                        callback(values, id, undefined, object, 'add');
                    } catch (exception)
                    {
                        console.error(exception, exception.stack);
                    }
                }
            }
        }

        // Check if all of the objects are in the same place
        const object_json_keys = object_json.map(item => item[id_property_name]);
        if (original_keys.length !== object_json_keys.length || !original_keys.every((value, index) => value === object_json_keys[index].toString())) {
            // if not set object list again to recreate the map
            this.store.parent_store.set(this.store.object_name, object_list);
        }
    }

    to_json() {
        const array = [];
        for (const [key, value] of Object.entries(this.store.object)) {
            if (typeof value === 'object' && 'to_json' in value)
                array.push(value.to_json());
            else if (typeof value === 'object' && 'store' in value && 'to_json' in value.store)
                array.push(value.store.to_json());
            else
                array.push(value);
        }

        return array;
    }
}

export class StoreArrayProxy {

    static proxy_properties = ['subscribe', 'subscriptions', 'action', 'actions', 'store', 'to_json'];
    static create_from_array(array, current_array=null, path, property_name, actions) {
        const proxy_handler = new StoreArrayProxy(array, path, actions);
        const proxy = new Proxy(array, proxy_handler);
        proxy_handler.store.object = proxy;
        if (current_array != null)
            proxy.store.object_subscriptions = current_array.store.object_subscriptions;
        return proxy;
    }

    constructor(object, path, actions) {
        this.object = object;
        this.actions = actions;
        this.action = this.action.bind(this);
        this.subscribe = this.subscribe.bind(this);

        // Needs to happen after members are set up
        this.store = new StoreState(path, object);
    }

    subscribe(callback) {
        this.store.object_subscriptions.push(callback);
        return true;
    }

    action(action, state) {
        if (!(action in this.actions))
            throw new Error(`Action [${action}] not found among the actions [${Object.keys(this.actions)}]`);
        this.actions[action](this.store, state);
    }

    has(target, property_name) {
        if (StoreArrayProxy.proxy_properties.includes(property_name))
            return true;
        return Reflect.has(target, property_name);
    }

    get(target, property_name) {
        if (StoreArrayProxy.proxy_properties.includes(property_name))
             return this[property_name];
        return Reflect.get(...arguments);
    }

    set(target, property_name, value, receiver) {
        if (property_name === 'subscriptions')
             return this.subscriptions = value;
        if (!Object.prototype.hasOwnProperty.call(target, property_name) || property_name === 'length')
            return Reflect.set(...arguments);
        if (this.store.object_subscriptions.length > 0) {
            const values = target.values();
            for (const callback of this.store.object_subscriptions) {
                try {
                    callback(values, property_name, target[property_name], value, 'change');
                } catch (exception)
                {
                    console.error(exception, exception.stack);
                }
            }
        }
        return Reflect.set(...arguments);
    }

    defineProperty(target, property_name, descriptor) {
        const value = descriptor['value'];
        if (Object.prototype.hasOwnProperty.call(target, property_name))
            return Reflect.defineProperty(...arguments);
        if (this.store.object_subscriptions.length > 0) {
            for (const callback of this.store.object_subscriptions) {
                try {
                    callback(target, property_name, target[property_name], value, 'add');
                } catch (exception)
                {
                    console.error(exception, exception.stack);
                }
            }
        }
        const original_values = [...this.object];
        const return_value = Reflect.defineProperty(target, property_name, descriptor);
        if (!is_called_from_function('create_from_array')) {
            for (const callback of this.store.object_subscriptions) {
                try {
                    callback(this, this.store.object_name, original_values, this.object, 'change');
                } catch (exception) {
                    console.error(exception, exception.stack);
                }
            }
        }
        return return_value;
    }

    deleteProperty(target, property_name) {
        if (this.store.object_subscriptions.length > 0) {
            for (const callback of this.store.object_subscriptions) {
                try {
                    callback(target, property_name, target[property_name], undefined, 'remove');
                } catch (exception)
                {
                    console.error(exception, exception.stack);
                }
            }
        }
        const original_values = [...this.object];
        const return_value = Reflect.deleteProperty(target, property_name);
        if (!is_called_from_function('create_from_array')) {
            for (const callback of this.store.object_subscriptions) {
                try {
                    callback(this, this.store.object_name, original_values, this.object.filter(item => item !== undefined), 'change');
                } catch (exception) {
                    console.error(exception, exception.stack);
                }
            }
        }
        return return_value;
    }

    to_json() {
        const array = [];
        for (const [key, value] of Object.entries(this.store.object)) {
            if (typeof value === 'object' && 'to_json' in value)
                array.push(value.to_json());
            else if (typeof value === 'object' && 'store' in value && 'to_json' in value.store)
                array.push(value.store.to_json());
            else
                array.push(value);
        }

        return array;
    }
}


export class StoreState {
    constructor(path, is_part_of_url=true, object=null) {
        if (!(typeof path === 'string'))
            throw new Error('A store must be intialized with a path of type [string].')
        if (path.startsWith('/'))
            path = path.slice(1);
        if (path.endsWith('/'))
            path = path.slice(0, -1);
        const path_parts = this._split_path(path, false);
        const is_global_store = path === '';
        this.object_name = path_parts[1];
        this.object = object;
        this.path = path;
        if (path_parts[0] != null) {
            const parent = global_store.get(path_parts[0], false);
            if (parent != null) {
                this.parent_store = parent.store;
            }
            else {
                global_store._awaiting_parent_store(path_parts[0], this);
                this.parent_store = null;
            }
        }
        else {
            if (!is_global_store) {
                this.parent_store = global_store;
                global_store._register_store(this.object_name, this);
            }
        }
        this.is_part_of_url = is_part_of_url;
        this.actions = {};
        this.state = {};
        this.dom_mapping = {};
        this.object_subscriptions = [];
        this.property_subscriptions = {};

        if (!is_global_store) {
            const callback = global_store._pop_future_subscription(path);
            if (callback != null)
                this.object_subscriptions.push(callback);
        }

        this._create_object_map = this._create_object_map.bind(this);
    }

    get_object_path() {
        return this.path;
    }

    get_object_url() {
        const parent_url = this.parent_store.get_object_url();
        if (!this.is_part_of_url)
            return parent_url;
        if (this.object_name != null) {
            if (this.parent_store != null)
                return `${parent_url}/${this.object_name}`;
            return `${this.object_name}`;
        }
        if (this.parent_store != null)
            return parent_url;
        return ``;
    }

    get(path, throw_not_found=true, raw_object=false) {
        const path_parts = this._split_path(path);
        if (!(path_parts[0] in this.state))
            return null;
        if (path_parts[1] == null) {
            if (this.state[path_parts[0]] instanceof StoreMap && !raw_object)
                return this.state[path_parts[0]].values();
            return this.state[path_parts[0]];
        }

        if (this.state[path_parts[0]] instanceof StoreMap) {
            const next_path_parts = this._split_path(path_parts[1]);
            if (next_path_parts[1] == null) {
                if (!(next_path_parts[0] in this.state[path_parts[0]])) {
                    if (throw_not_found)
                        throw new Error(`ID [${next_path_parts[0]}] does not exist for object_name [${path_parts[0]}]`);
                    return null;
                }
                return this.state[path_parts[0]][next_path_parts[0]];
            }
            else {
                if (next_path_parts[0] in this.state[path_parts[0]])
                    return this.state[path_parts[0]][next_path_parts[0]].store.get(next_path_parts[1], throw_not_found, raw_object);
            }
        }
        else if (is_store_object(this.state[path_parts[0]])) {
            return this.state[path_parts[0]].store.get(path_parts[1], throw_not_found, raw_object);
        }

        if (throw_not_found)
            throw new Error(`Path part [${path}] is not valid`);
        else
            return null;
    }

    get_json(path) {
        const path_parts = this._split_path(path);
        if (!(path_parts[0] in this.state))
            return null;
        if (path_parts[1] == null) {
            if (this.state[path_parts[0]] instanceof StoreMap)
                return this.state[path_parts[0]].to_json();
            return this.state[path_parts[0]];
        }

        if (this.state[path_parts[0]] instanceof StoreMap) {
            const next_path_parts = this._split_path(path_parts[1]);
            if (next_path_parts[1] == null) {
                if (!(next_path_parts[0] in this.state[path_parts[0]]))
                    throw new Error(`ID [${next_path_parts[0]}] does not exist for object_name [${path_parts[0]}]`);
                return this.state[path_parts[0]][next_path_parts[0]];
            }
            else {
                if (next_path_parts[0] in this.state[path_parts[0]])
                    return this.state[path_parts[0]][next_path_parts[0]].store.get_json(next_path_parts[1]);
            }
        }
        else if ('store' in this.state[path_parts[0]] && this.state[path_parts[0]].store instanceof StoreState) {
            return this.state[path_parts[0]].store.get_json(path_parts[1]);
        }

        throw new Error(`Path part [${path}] is not valid`);
    }

    get_url(path) {
        const path_parts = this._split_path(path);
        if (!(path_parts[0] in this.state))
            return null;
        if (path_parts[1] == null) {
            if (is_store_object(this.state[path_parts[0]]))
                return this.state[path_parts[0]].store.get_object_url();
            throw new Error(`Path part [${path_parts[0]}] is not valid object with a store`);
        }

        if (this.state[path_parts[0]] instanceof StoreMap) {
            const next_path_parts = this._split_path(path_parts[1]);
            if (next_path_parts[1] == null) {
                if (!(next_path_parts[0] in this.state[path_parts[0]]))
                    throw new Error(`ID [${next_path_parts[0]}] does not exist for object_name [${path_parts[0]}]`);
                return this.state[path_parts[0]][next_path_parts[0]];
            }
            else {
                if (next_path_parts[0] in this.state[path_parts[0]])
                    return this.state[path_parts[0]][next_path_parts[0]].store.get_url(next_path_parts[1]);
            }
        }
        else if ('store' in this.state[path_parts[0]] && this.state[path_parts[0]].store instanceof StoreState) {
            return this.state[path_parts[0]].store.get_url(path_parts[1]);
        }

        throw new Error(`Path part [${path}] is not valid`);
    }

    set(path, object) {
        const path_parts = this._split_path(path);
        if (path_parts[1] == null) {
            if (this.state[path_parts[0]] instanceof StoreMap) {
                this.state[path_parts[0]] = this._create_object_map(object, this.state[path_parts[0]], `${this.path}/${path_parts[0]}`, path_parts[0], this.actions[path_parts[0]]);
                if ('_update_dom' in this)
                    this._update_dom(path_parts[0]);
                return this.state[path_parts[0]];
            }
            else if (Array.isArray(object) && object.length > 0 && is_store_object(object))
                return this.set_object_map(path_parts[0], object, this.dom_mapping[path_parts[0]], this.state[path_parts[0]].actions);
            // Make sure we can trigger subscriptions. Alternatively could just loop through the subscriptions
            if ('object' in this && this.object != null)
                return this.object[path_parts[0]] = object;
            return this.state[path_parts[0]] = object;
        }

        if (this.state[path_parts[0]] instanceof StoreMap) {
            const next_path_parts = this._split_path(path_parts[1]);
            if (next_path_parts[1] == null) {
                return this.state[path_parts[0]][next_path_parts[0]] = object;
            }
            else {
                if (next_path_parts[0] in this.state[path_parts[0]])
                    return this.state[path_parts[0]][next_path_parts[0]].store.set(next_path_parts[1], object);
            }
        }
        else if ('store' in this.state[path_parts[0]] && this.state[path_parts[0]].store instanceof StoreState) {
            return this.state[path_parts[0]].store.set(path_parts[1], object);
        }

        throw new Error(`Path part [${path}] is not valid`);
    }

    set_json(path, object_json) {
        const path_parts = this._split_path(path);
        if (path_parts[1] == null) {
            if (typeof object_json !== "object") {
                // Make sure we can trigger subscriptions. Alternatively could just loop through the subscriptions
                if ('object' in this && this.object != null)
                    return this.object[path_parts[0]] = object_json;
                return this.state[path_parts[0]] = object_json;
            }
            if ('update_from_json' in this.state[path_parts[0]])
                return this.state[path_parts[0]].update_from_json(object_json);
            return this.object[path_parts[0]].store.update_from_json(object_json);
        }

        if (this.state[path_parts[0]] instanceof StoreMap) {
            const next_path_parts = this._split_path(path_parts[1]);
            if (next_path_parts[1] == null) {
                if (!(next_path_parts[0] in this.state[path_parts[0]])) {
                    const [create_from_json_function, id_property_name] = global_store.get_create_from_json_function(`${this.get_object_path()}/${path_parts[0]}`);
                    const object = create_from_json_function(object_json, `${this.get_object_path()}/${path}`);
                    return this.state[path_parts[0]].store.set(next_path_parts[0], object);
                } else if ('update_from_json' in this.state[path_parts[0]][next_path_parts[0]])
                    return this.state[path_parts[0]][next_path_parts[0]].update_from_json(object_json);
                return this.state[path_parts[0]][next_path_parts[0]].store.update_from_json(object_json);
            }
            else {
                if (next_path_parts[0] in this.state[path_parts[0]])
                    return this.state[path_parts[0]][next_path_parts[0]].store.set_json(next_path_parts[1], object_json);
            }
        }
        else if ('store' in this.state[path_parts[0]] && this.state[path_parts[0]].store instanceof StoreState) {
            return this.state[path_parts[0]].store.set_json(path_parts[1], object_json);
        }

        throw new Error(`Path part [${path}] is not valid`);
    }

    pass_through(value) {
        return value;
    }

    _set_member(object, property_name, value, query_string=null, actions={}, on_change_callback=null, create_new_value=this.pass_through, transform_current_value=this.pass_through) {
        this.state[property_name] = value;
        this.actions[property_name] = actions;
        this.property_subscriptions[property_name] = [];
        if (on_change_callback != null)
            this.property_subscriptions[property_name].push(on_change_callback);
        if (query_string != null)
            this.dom_mapping[property_name] = query_string;
        if (object != null) {
            if (!is_store_object(object))
                throw new Error("The object needs to have a store property of type Store");
            Object.defineProperty(object, property_name, {
                // This now refers to the this.object
                get: function () {
                    return this.store.state[property_name];
                },
                set: function (new_value) {
                    if (this.store.object_subscriptions.length > 0 || this.store.property_subscriptions[property_name].length > 0) {
                        const transformed_current_value = transform_current_value(this.store.state[property_name]);
                        for (const callback of this.store.object_subscriptions) {
                            try {
                                callback(this, property_name, transformed_current_value, new_value, 'change');
                            } catch (exception)
                            {
                                console.error(exception, exception.stack);
                            }
                        }
                        for (const callback of this.store.property_subscriptions[property_name]) {
                            try {
                                callback(this, property_name, transformed_current_value, new_value, 'change');
                            } catch (exception)
                            {
                                console.error(exception, exception.stack);
                            }
                        }
                    }
                    this.store.state[property_name] = create_new_value(new_value, this.store.state[property_name], `${this.store.path}/${property_name}`, property_name, actions);
                    this.store._update_dom(property_name);
                }
            });
        }
    }

    _set_object_map(object, property_name, object_list, query_string=null, actions={}, on_change_callback=null) {
        const object_map = this._create_object_map(object_list, null, `${this.path}/${property_name}`, property_name, actions);
        this._set_member(object, property_name, object_map, query_string, actions, on_change_callback, this._create_object_map, (current_value) => current_value.values())
    }

    _create_object_map(object_list, current_object_map=null, path, property_name, actions) {
        if (!Array.isArray(object_list))
            throw new Error("Expected an array of objects");

        const object_map = StoreMapProxy.create_from_object(new StoreMap(), path, actions);
        if (current_object_map != null)
            object_map.store.object_subscriptions = current_object_map.store.object_subscriptions;
        for (const object of object_list) {
            if (!is_store_object(object))
                throw new Error("While an array of objects has been passed in, at least one object does not have a store property of type Store");
            object_map[object.store.get_id()] = object;
        }
        if (current_object_map != null) {
            // Check if all of the objects are in the same place
            const original_keys = Object.keys(current_object_map);
            const object_keys = object_list.map(item => item.store.get_id());
            if (original_keys.length !== object_keys.length || !original_keys.every((value, index) => value.toString() === object_keys[index].toString())) {
                // if not set call the callback to say it's changed
                for (const callback of object_map.store.object_subscriptions) {
                    try {
                        callback(this.object, property_name, current_object_map.values(), object_list, 'change');
                    } catch (exception)
                    {
                        console.error(exception, exception.stack);
                    }
                }
            }
        }
        else {
            for (const callback of object_map.store.object_subscriptions) {
                try {
                    callback(this.object, property_name, [], object_list, 'change');
                } catch (exception)
                {
                    console.error(exception, exception.stack);
                }
            }
        }
        return object_map;
    }

    set_object_map(property_name, object_list, query_string=null, actions={}, on_change_callback=null) {
        this._set_object_map(null, property_name, object_list, query_string, actions, on_change_callback);
    }

    subscribe(path, callback) {
        const path_parts = this._split_path(path);
        if (path_parts[1] == null) {
            if (typeof this.state[path] === 'object' && 'subscribe' in this.state[path])
                this.state[path].subscribe(callback);
            else if (is_store_object(this.state[path]))
                this.state[path].store._subscribe_object(callback);
            return this._subscribe_property(path, callback);
        }

        if (path_parts[0] in this.state) {
            if (this.state[path_parts[0]] instanceof StoreMap) {
                const next_path_parts = this._split_path(path_parts[1]);
                if (next_path_parts[1] == null) {
                    if (!(next_path_parts[0] in this.state[path_parts[0]]))
                        return false;
                    return this.state[path_parts[0]][next_path_parts[0]].store._subscribe_object(callback);
                } else {
                    if (next_path_parts[0] in this.state[path_parts[0]])
                        return this.state[path_parts[0]][next_path_parts[0]].store.subscribe(next_path_parts[1], callback);
                    else
                        return false;
                }
            } else if ('store' in this.state[path_parts[0]] && this.state[path_parts[0]].store instanceof StoreState) {
                return this.state[path_parts[0]].store.subscribe(path_parts[1], callback);
            }
        }

        return false;
    }

    _subscribe_property(property_name, callback) {
        if (!(property_name in this.property_subscriptions && property_name in this.state))
            return false;
        this.property_subscriptions[property_name].push(callback);
        return true;
    }

    _subscribe_object(callback) {
        this.object_subscriptions.push(callback);
        return true;
    }

    async action(action, path, state) {
        const path_parts = this._split_path(path);
        if (path_parts[1] == null) {
            if (typeof this.state[path] === 'object' && 'action' in this.state[path])
                return this.state[path].action(action, state);
            throw `Not Implemented`;
        }

        if (this.state[path_parts[0]] instanceof StoreMap) {
            const next_path_parts = this._split_path(path_parts[1]);
            if (next_path_parts[1] == null) {
                if (!(next_path_parts[0] in this.state[path_parts[0]]))
                    throw new Error(`ID [${next_path_parts[0]}] does not exist for object_name [${path_parts[0]}]`);
                return this.state[path_parts[0]][next_path_parts[0]].store._action(action, state);
            }
            else {
                if (next_path_parts[0] in this.state[path_parts[0]])
                    return this.state[path_parts[0]][next_path_parts[0]].store.action(action, next_path_parts[1], state);
                else
                    throw new Error(`Path part [${next_path_parts[0]}] in path [${path}] is not valid`);
            }
        }
        else if ('store' in this.state[path_parts[0]] && this.state[path_parts[0]].store instanceof StoreState) {
            return this.state[path_parts[0]].store.action(action, path_parts[1], state);
        }

        throw new Error(`Path [${path}] is not valid`);
    }

    _split_path(path, split_first=true) {
        // Remove trialing slashes
        if (path.startsWith('/'))
            path = path.slice(1);
        if (path.endsWith('/'))
            path = path.slice(0, -1);
        // See if it's made up of more than on section
        const first_part_index = split_first ? path.indexOf('/') : path.lastIndexOf('/');
        if (first_part_index === -1)
            return split_first ? [path, null] : [null, path];
        let path_parts = [path.substring(0, first_part_index), path.substring(first_part_index + 1)];
        path_parts = path_parts.map(item => item === '' ? null : item);
        return path_parts;
    }

    to_json() {
        const json = {};
        for (const [key, value] of Object.entries(this.state)) {
            if (typeof value === 'object' && 'to_json' in value)
                json[key] = value.to_json();
            else if (is_store_object(value))
                json[key] = value.store.to_json();
            else
                json[key] = value;
        }

        return json;
    }

    update_from_json(object_json) {
        for (const [key, value] of Object.entries(this.state)) {
            if (!(key in object_json))
                continue;

            if (is_store_object(value)) {
                if ('update_from_json' in value)
                    value.update_from_json(object_json[key]);
                else
                    value.store.update_from_json(object_json[key]);
            } else if (object_json[key] !== value)
                this.set(key, object_json[key]);
        }
    }
}