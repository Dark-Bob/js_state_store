import {StoreMap, StoreState, StoreArrayProxy} from "./StoreState.js";
import global_store from "./GlobalStore.js";

export default class Store extends StoreState {
    constructor({object, path, actions = {}, is_part_of_url= true}) {
        super(path, is_part_of_url, object);
        this.actions = actions;
        this.id_property_name = null;
    }

    set_id(id_property_name, value, query_string=null) {
        if (value.toString() !== this.object_name)
            throw new Error(`Object id [${value}] is different to the path [${this.object_name}]`)
        this._set_member(this.object, id_property_name, value, query_string);
        this.id_property_name = id_property_name;
    }

    get_id() {
        return this.state[this.id_property_name].toString();
    }

    get_object_path() {
        return this.path;
    }

    get_object_url() {
        global_store._reconcile_stores();
        const parent_url = this.parent_store.get_object_url();
        if (!this.is_part_of_url)
            return parent_url;
        if (this.parent_store != null)
            return `${parent_url}/${this.object_name}/${this.get_id()}`;
        return `${this.object_name}/${this.get_id()}`;
    }

    set_member(property_name, value, query_string=null, on_change_callback=null) {
        this._set_member(this.object, property_name, value, query_string, {}, on_change_callback);
    }

    set_member_map(property_name, value, query_string=null, actions={}, on_change_callback=null) {
        this._set_object_map(this.object, property_name, value, query_string, actions, on_change_callback);
    }

    set_member_array(property_name, array, query_string=null, actions={}, on_change_callback=null) {
        if (!Array.isArray(array))
            throw new Error('This function expects an array as the second parameter.');
        const array_proxy = StoreArrayProxy.create_from_array(array, null, `${this.path}/${property_name}`, property_name, actions);
        if (on_change_callback != null)
            array_proxy.subscribe(on_change_callback)
        this._set_member(this.object, property_name, array_proxy, query_string, {}, on_change_callback, StoreArrayProxy.create_from_array, Array.from);
    }

    _update_dom(property_name) {
        if (property_name in this.dom_mapping) {
            const root = this.object.shadowRoot ? this.object.shadowRoot : document;
            const query_string = this.dom_mapping[property_name];
            const elements = root.querySelectorAll(query_string);
            for (const element of elements) {
                if (this.state[property_name] instanceof StoreMap) {
                    while (element.firstChild) {
                        element.removeChild(element.lastElementChild);
                    }
                    for (const child_element of this.state[property_name].values())
                        element.appendChild(child_element);
                }
                else if (Array.isArray(this.state[property_name])) {
                    while (element.firstChild) {
                        element.removeChild(element.lastElementChild);
                    }
                    for (const child_element of this.state[property_name])
                        element.appendChild(child_element);
                }
                else if (this.state[property_name] instanceof HTMLElement) {
                    element.appendChild(this.state[property_name])
                }
                else {
                    element.innerText = this.state[property_name];
                }
            }
        }
    }

    synchronize_dom() {
        for (const property_name of Object.keys(this.dom_mapping)) {
            this._update_dom(property_name);
        }
    }

    _action(action, state) {
        if (!(action in this.actions))
            throw new Error(`Action [${action}] not found among the actions [${Object.keys(this.actions)}] for object [${this.object_name}/${this.get_id()}]`);
        this.actions[action](this, state);
    }
}