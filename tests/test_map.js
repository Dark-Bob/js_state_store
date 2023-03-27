import {assert, assert_arrays_are_equal} from "./helpers/Assert.js";
import {set_test_request_data} from "./helpers/FakeFetch.js"
import Car from "./fixtures/Car.js";
import Engine from "./fixtures/Engine.js";
import populate_store from "./fixtures/DataModel.js";
import {is_store_object, StoreState, MapProxy} from "../src/StoreState.js";

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
    }
}

export default tests;