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

    static create_from_json(object_json, parent_store) {
        return new Location(object_json.location, object_json.description, parent_store);
    }

    constructor(location, description, parent_store=null) {
        super();
        this.store = new Store({object: this, object_name: 'locations', parent_store: parent_store, actions: api_actions_object});
        this.store.set_id('location', location, '#title');
        this.store.set_member('description', description, '.description');
        this.store.set_member_map('cars', [
            new Car(0, 'Ferrari', 'F40', 80_000, this.store),
            new Car(1, 'Lamborghini', 'Diablo', 100_000, this.store)
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