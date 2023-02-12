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

        global_store.set('locations/Wandsworth/cars/0/engine/type', '2.0L 4-cylinder');
        assert(global_store.get('locations/Wandsworth/cars/0/engine/type') === '2.0L 4-cylinder');
        global_store.get('locations/Wandsworth/cars/0/engine').type = '1.5L 4-cylinder';
        assert(global_store.get('locations/Wandsworth/cars/0/engine/type') === '1.5L 4-cylinder');
        global_store.set('locations/Wandsworth/cars/0/engine/', new Engine('3.0L 6-cylinder', global_store.get('locations/Wandsworth/cars/0').store));
        assert(global_store.get('locations/Wandsworth/cars/0/engine/type') === '3.0L 6-cylinder');

        const wandsworth = global_store.get('locations/Wandsworth');
        global_store.set('locations/Wandsworth/cars/', [new Car(3, 'Mercedes', "E-Class", wandsworth.store), new Car(4, "Hyundai", "Ionic", wandsworth.store)]);
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
        assert(global_store.get('locations/Wandsworth/cars/3/brand') === 'Mercedes');
        wandsworth.cars = [new Car(5, 'Ferrari', "F40", wandsworth.store)]
        assert(global_store.get('locations/Wandsworth/cars/5/brand') === 'Ferrari');
        try {
            global_store.get('locations/Wandsworth/cars/3/brand');
            assert(false, "Should not have passed previous test");
        }
        catch (e) {

            if (e.message !== 'Path part [cars/3/brand] is not valid') {
                console.error(e);
                throw e;
            }
        }
        const cars = global_store.get('locations/Wandsworth/cars');
        assert(cars.length === 1);
        wandsworth.cars[6] = new Car(6, 'Kia', "Sportage", wandsworth.store);
        assert(global_store.get('locations/Wandsworth/cars/6/brand') === 'Kia');
    }
}

export default tests;