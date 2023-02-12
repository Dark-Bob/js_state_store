
const template = document.createElement("template");
template.innerHTML = `
    <div id="name"></div>
`

export default class Wheel extends HTMLElement {
    constructor(name) {
        super();
        this.name = name
    }

    to_json() {
        return {name: this.name};
    }

    connectedCallback() {
        if (!this.shadowRoot) {
            this.attachShadow({mode: 'open'});
            const template_element = template.content.cloneNode(true);
            template_element.getElementById('name').innerText = this.name;
            this.shadowRoot.appendChild(template_element);
        }
    }
}

window.customElements.define('k-wheel', Wheel);