import Store from "../../src/Store.js";
import {api_actions_object} from "../../src/ApiActions.js";
import Car from "./Car.js";

const template = document.createElement("template");
template.innerHTML = `
    <div id="type"></div>
`

export default class Engine extends HTMLElement {

    static create_from_json(object_json, store_path) {
        return new Engine(object_json.type, store_path);
    }
    constructor(type, store_path) {
        super();
        this.store = new Store({object: this, path: store_path, actions: api_actions_object});
        this.store.set_member('type', type, '#type');
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

global_store.register_create_from_json_function("locations/.*/cars/.*/engine$", Engine.create_from_json);
window.customElements.define('k-engine', Engine);