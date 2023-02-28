import {assert} from "./helpers/Assert.js";
import {set_test_request_data} from "./helpers/FakeFetch.js"
import Car from "./fixtures/Car.js";
import Engine from "./fixtures/Engine.js";
import populate_store from "./fixtures/DataModel.js";
import global_store from "../src/GlobalStore.js";

const tests = {
    test_get() {
    },
    test_set_json() {
        populate_store();

        global_store.set_json('locations/Wandsworth/cars/0/brand', 'Toyota');
        assert(global_store.get('locations/Wandsworth/cars/0/brand') === 'Toyota');
        global_store.set_json('locations/Wandsworth/cars/0/brand/', 'Mazda');
        assert(global_store.get('locations/Wandsworth/cars/0/brand') === 'Mazda');
        global_store.set_json('locations/Wandsworth/cars/0', {id: 0, brand: 'Mazda', model: "Hatchback"});
        assert(global_store.get('locations/Wandsworth/cars/0/').brand === 'Mazda');
        global_store.set_json('locations/Wandsworth/cars/9', {id: 9, brand: 'Ford', model: "Escort"});
        assert(global_store.get('locations/Wandsworth/cars/9/').brand === 'Ford');

        global_store.set_json('locations/Wandsworth/cars/0/engine/type', '2.0L 4-cylinder');
        assert(global_store.get('locations/Wandsworth/cars/0/engine/type') === '2.0L 4-cylinder');
        global_store.set_json('locations/Wandsworth/cars/0/engine/', {type: '3.0L 6-cylinder'});
        assert(global_store.get('locations/Wandsworth/cars/0/engine/type') === '3.0L 6-cylinder');

        global_store.set_json('locations/Wandsworth/cars/', [{id: 3, brand: 'Mercedes', model: "E-Class", price: 11_000}, {id: 4, brand: "Hyundai", model: "Ionic", price: 11_000}]);
        try {
            global_store.get('locations/Wandsworth/cars/0/brand');
            assert(false, "Should not have passed previous test");
        }
        catch (e) {
            if (e.message !== 'Path part [cars/0/brand] is not valid') {
                console.error(e);
                throw e;
            }
        }
        assert(global_store.get('locations/Wandsworth/cars').length);
        global_store.set_json('locations/Wandsworth/cars/', [{id: 5, brand: 'Fiat', model: "Panda", price: 11_000, engine: {type: 'twin-prop'}}]);
        assert(global_store.get('locations/Wandsworth/cars/5/engine/type') === 'twin-prop');
        global_store.set_json('locations/Wandsworth/cars/5', {id: 5, brand: 'Fiat', model: "Panda", price: 11_000, engine: {type: 'horse-drawn'}});
        assert(global_store.get('locations/Wandsworth/cars/5/engine/type') === 'horse-drawn');
    }
}

export default tests;