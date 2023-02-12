
class Events {
    constructor(){
        this.callbacks = {};
    }

    register_callback(name, callback) {
        if (name in this.callbacks)
            this.callbacks[name].push(callback);
        else
            this.callbacks[name] = [callback];
    }

    unregister_callback(name, callback) {
        if (name in this.callbacks)
            this.callbacks[name] = this.callbacks[name].filter(c => c !== callback);
    }

    on_event(name) {
        let params = Array.prototype.slice.call(arguments);
        params.shift();
        if (name in this.callbacks) {
            for (let i = 0; i < this.callbacks[name].length; ++i) {
                this.callbacks[name][i].apply(this, params);
            }
        }
    }
}


const events = new Events

export default events