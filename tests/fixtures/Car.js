import {api_actions_object} from "../../src/ApiActions.js"
import Store from "../../src/Store.js";
import Wheel from "./Wheel.js"
import Engine from "./Engine.js";
import Location from "./Location.js";

const template = document.createElement("template");
template.innerHTML = `
    <div>
        <div id="brand"></div>
        <div id="model"></div>
        <div>£<span id="price"></span></div>
        <div>Engine</div>
        <slot name="engine"></slot>
        <div>Wheels</div>
        <slot name="wheels"></slot>
        <hr/>
    </div>
`

export default class Car extends HTMLElement {

    static id_member_name = 'id';
    static create_from_json(object_json, store_path) {
        return new Car(object_json.id, object_json.brand, object_json.model, object_json.price, store_path);
    }

    constructor(id, brand, model, price, store_path) {
        super();
        this.store = new Store({object: this, path: store_path, actions: api_actions_object});
        this.store.set_id(Car.id_member_name, id);
        this.store.set_member('brand', brand, '#brand');
        this.store.set_member('model', model, '#model');
        this.store.set_member('price', price, '#price');
        this.store.set_member('engine', new Engine('twin-turbo V8', `${store_path}/engine`), 'slot[name=engine]');
        this.store.set_member_array('wheels', [
            new Wheel('front-right'),
            new Wheel('front-left'),
            new Wheel('rear-right'),
            new Wheel('rear-left')], 'slot[name=wheels]');
    }

    connectedCallback() {
        if (!this.shadowRoot) {
            this.attachShadow({mode: 'open'});
            const template_element = template.content.cloneNode(true);
            this.shadowRoot.appendChild(template_element);
            this.store.synchronize_dom();
        }
    }
}

global_store.register_create_from_json_function("locations/.*/cars$", Car.create_from_json, Car.id_member_name);
window.customElements.define('k-car', Car);