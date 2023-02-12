import {is_store_object, StoreState} from "./StoreState.js";

export default class StoreArrayProxy {

    static create_from_array(array, current_array=null) {
        const array_proxy = new Proxy(array, new StoreArrayProxy(array));
        if (current_array != null)
            array_proxy.subscriptions = current_array.subscriptions;
        return array_proxy;
    }

    constructor(object) {
        this.object = object;
        this.subscriptions = [];
        this.subscribe = this.subscribe.bind(this);
    }

    subscribe(callback) {
        this.subscriptions.push(callback);
    }

    has(target, property_name) {
        if (['subscribe', 'subscriptions', 'to_json'].includes(property_name))
            return true;
        return Reflect.has(target, property_name);
    }

    get(target, property_name) {
        if (['subscribe', 'subscriptions', 'to_json', 'object'].includes(property_name))
             return this[property_name];
        return Reflect.get(...arguments);
    }

    set(target, property_name, value, receiver) {
        if (property_name === 'subscriptions')
             return this.subscriptions = value;
        if (!Object.prototype.hasOwnProperty.call(target, property_name) || property_name === 'length')
            return Reflect.set(...arguments);
        if (this.subscriptions.length > 0) {
            const values = target.values();
            for (const callback of this.subscriptions)
                callback(values, property_name, target[property_name], value, 'change');
        }
        return Reflect.set(...arguments);
    }

    defineProperty(target, property_name, descriptor) {
        if (Object.prototype.hasOwnProperty.call(target, property_name))
            return Reflect.defineProperty(...arguments);
        if (this.subscriptions.length > 0) {
            for (const callback of this.subscriptions)
                callback(target, property_name, target, descriptor['value'], 'add');
        }
        return Reflect.defineProperty(target, property_name, descriptor);
    }

    deleteProperty(target, property_name) {
        if (this.subscriptions.length > 0) {
            for (const callback of this.subscriptions)
                callback(target, property_name, target, undefined, 'remove');
        }
        return Reflect.deleteProperty(target, property_name);
    }

    to_json() {
        const array = [];
        for (const [key, value] of Object.entries(this.object)) {
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