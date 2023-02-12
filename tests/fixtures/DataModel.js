import {create_api_actions_map} from "../../src/ApiActions.js";
import global_store from "../../src/GlobalStore.js";
import Location from "./Location.js"
import Car from "./Car.js";

global_store.set_base_url('api/v1');


export default function populate_store() {
    global_store.clear();

    const locations = [
        new Location('Wandsworth', 'Cheap cars'),
        new Location('Croydon', 'Bare dealz')
    ];
    global_store.set_object_map('locations', locations, null, create_api_actions_map(Location));

    return global_store;
}

