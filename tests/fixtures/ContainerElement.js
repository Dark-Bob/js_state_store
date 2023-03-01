import {api_actions_object, api_actions_map} from "../../src/ApiActions.js"
import Store from "../../src/Store.js";
import Car from "./Car.js"
import global_store from "../../src/GlobalStore.js";
import Location from "./Location.js";

const template = document.createElement("template");
template.innerHTML = `
    <slot name="locations"></slot>
`

export default class ContainerElement extends HTMLElement {

    static create_from_json(object_json) {
        return new Location(object_json.location, object_json.description);
    }

    constructor(location, description) {
        super();
        this.store = new Store({object: this, path: 'container', actions: api_actions_object, is_part_of_url: false});
        this.store.set_member_map('locations', [
            new Location('Wandsworth', 'Cheap cars', 'container/locations/Wandsworth'),
            new Location('Croydon', 'Bare dealz', 'container/locations/Croydon')
        ], 'slot[name=locations]', api_actions_map)
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

window.customElements.define('k-container-element', ContainerElement);