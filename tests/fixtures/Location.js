import {api_actions_object, create_api_actions_map} from "../../src/ApiActions.js"
import Store from "../../src/Store.js";
import Car from "./Car.js"

const template = document.createElement("template");
template.innerHTML = `
    <div>
        <h3 id="title"></h3>
        <div class="description"></div>
        <hr/>
        <slot name="cars"></slot>
        <div class="description"></div>
    </div>
`

export default class Location extends HTMLElement {

    static id_member_name = 'location';
    static create_from_json(object_json, store_path) {
        return new Location(object_json.location, object_json.description, store_path);
    }

    constructor(location, description, store_path) {
        super();
        this.store = new Store({object: this, path: store_path, actions: api_actions_object});
        this.store.set_id(Location.id_member_name, location, '#title');
        this.store.set_member('description', description, '.description');
        this.store.set_member_map('cars', [
            new Car(0, 'Ferrari', 'F40', 80_000, `${store_path}/cars/0`),
            new Car(1, 'Lamborghini', 'Diablo', 100_000, `${store_path}/cars/1`)
        ], 'slot[name=cars]', create_api_actions_map(Car, this.store));
        console.log(`Location: ${this.location}, ${this.description}`);
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

window.customElements.define('k-location', Location);