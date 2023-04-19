import {assert, assert_arrays_are_equal} from "./helpers/Assert.js";
import {set_test_request_data} from "./helpers/FakeFetch.js"
import Car from "./fixtures/Car.js";
import Engine from "./fixtures/Engine.js";
import populate_store from "./fixtures/DataModel.js";
import {is_store_object, StoreState, MapProxy} from "../src/StoreState.js";
import global_store from "../src/GlobalStore.js";
import {api_actions_map} from "../src/ApiActions.js";
import Location from "./fixtures/Location.js";

const tests = {
    test_map_proxy_insert_order() {
        const objects = [{id: 42, data: '42'}, {id: 38, data: '38'}, {id: 39, data: '39'}];
        const map = new Proxy(new Map(), new MapProxy());

        for (const object of objects) {
            map[object.id] = object;
        }

        assert_arrays_are_equal(Object.keys(map), [42, 38, 39]);
        assert_arrays_are_equal(Object.values(map), objects);
        assert_arrays_are_equal(Object.entries(map), objects.map(item => [item.id, item]));
        assert(map.length === 3);
        assert(map.values().length === 3);

        console.log(Array.from(Object.keys(map)));
        console.log(Array.from(Object.values(map)));
        console.log(Array.from(Object.entries(map)));
    },

    test_map_starting_null() {
        global_store.clear();

        let called = false;
        global_store.set_object_map('locations', null);

        global_store.subscribe(
            `locations`,
            (object, property_name, current_value, new_value, change) => {
                assert(change === 'change')
                assert(new_value.length === 2);
                called = true;
        });

        const locations = [
            new Location('Wandsworth', 'Cheap cars', 'locations/Wandsworth'),
            new Location('Croydon', 'Bare dealz', 'locations/Croydon')
        ];
        global_store.set('locations', locations);
        assert(called);
    }
}

export default tests;