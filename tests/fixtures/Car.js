import {api_actions_object} from "../../src/ApiActions.js"
import Store from "../../src/Store.js";
import Wheel from "./Wheel.js"
import Engine from "./Engine.js";

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

    static create_from_json(object_json, parent_store) {
        return new Location(object_json.id, object_json.brand, object_json.model, object_json.price, parent_store);
    }

    constructor(id, brand, model, price, parent_store) {
        super();
        this.store = new Store({object: this, object_name: 'cars', parent_store: parent_store, actions: api_actions_object});
        this.store.set_id('id', id);
        this.store.set_member('brand', brand, '#brand');
        this.store.set_member('model', model, '#model');
        this.store.set_member('price', price, '#price');
        this.store.set_member('engine', new Engine('twin-turbo V8', this.store), 'slot[name=engine]');
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

window.customElements.define('k-car', Car);