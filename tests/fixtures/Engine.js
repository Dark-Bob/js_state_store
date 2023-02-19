import Store from "../../src/Store.js";
import {api_actions_object} from "../../src/ApiActions.js";

const template = document.createElement("template");
template.innerHTML = `
    <div id="type"></div>
`

export default class Engine extends HTMLElement {
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

window.customElements.define('k-engine', Engine);