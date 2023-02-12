import {assert} from "./helpers/Assert.js";
import {set_test_request_data} from "./helpers/FakeFetch.js"
import Car from "./fixtures/Car.js";
import Engine from "./fixtures/Engine.js";
import populate_store from "./fixtures/DataModel.js";

const tests = {
    test_get() {
        const store = populate_store();

        assert(store.get('locations/Wandsworth/cars/0/brand') === 'Ferrari');
        assert(store.get('locations/Wandsworth/cars/0').brand === 'Ferrari');
        assert(store.get('locations/Wandsworth/cars/0/').brand === 'Ferrari');
        assert(store.get('locations/Wandsworth/cars/0/engine/type') === 'twin-turbo V8');
        assert(store.get('locations/Wandsworth/cars/1/brand') === 'Lamborghini');
        assert(store.get('locations/Wandsworth/cars/1').brand === 'Lamborghini');
        assert(store.get('locations/Wandsworth/cars/0/price') === 80000);
        assert(store.get('locations/Wandsworth/cars/1').price === 100_000);
        const cars = store.get('locations/Wandsworth/cars');
        assert(cars.length === 2);
        assert(cars[0].brand === 'Ferrari');
        assert(cars[1].brand === 'Lamborghini');
        assert(store.get('locations/Wandsworth/description') === 'Cheap cars');
        assert(store.get('locations/Wandsworth').description === 'Cheap cars');
        const locations = store.get('locations');
        assert(locations.length === 2);
        assert(locations[0].location === 'Wandsworth');
        assert(locations[1].location === 'Croydon');
        // ensure that iteration works
        for (const location of locations)
            assert(['Wandsworth', 'Croydon'].includes(location.location))
    },
    test_set() {
        const store = populate_store();

        store.set('locations/Wandsworth/cars/0/brand', 'Toyota');
        assert(store.get('locations/Wandsworth/cars/0/brand') === 'Toyota');
        store.set('locations/Wandsworth/cars/0/brand/', 'Mazda');
        assert(store.get('locations/Wandsworth/cars/0/brand') === 'Mazda');
        store.get('locations/Wandsworth/cars/0/').brand = 'Toyota';
        assert(store.get('locations/Wandsworth/cars/0').brand === 'Toyota');
        store.set('locations/Wandsworth/cars/0', new Car(0, 'Mazda', "Hatchback"));
        assert(store.get('locations/Wandsworth/cars/0/').brand === 'Mazda');

        store.set('locations/Wandsworth/cars/0/engine/type', '2.0L 4-cylinder');
        assert(store.get('locations/Wandsworth/cars/0/engine/type') === '2.0L 4-cylinder');
        store.get('locations/Wandsworth/cars/0/engine').type = '1.5L 4-cylinder';
        assert(store.get('locations/Wandsworth/cars/0/engine/type') === '1.5L 4-cylinder');
        store.set('locations/Wandsworth/cars/0/engine/', new Engine('3.0L 6-cylinder', store.get('locations/Wandsworth/cars/0').store));
        assert(store.get('locations/Wandsworth/cars/0/engine/type') === '3.0L 6-cylinder');

        const wandsworth = store.get('locations/Wandsworth');
        store.set('locations/Wandsworth/cars/', [new Car(3, 'Mercedes', "E-Class", wandsworth.store), new Car(4, "Hyundai", "Ionic", wandsworth.store)]);
        try {
            store.get('locations/Wandsworth/cars/0/brand');
            assert(false, "Should not have passed previous test");
        }
        catch (e) {
            if (e.message !== 'Path part [cars/0/brand] is not valid') {
                console.error(e);
                throw e;
            }
        }
        assert(store.get('locations/Wandsworth/cars/3/brand') === 'Mercedes');
        wandsworth.cars = [new Car(5, 'Ferrari', "F40", wandsworth.store)]
        assert(store.get('locations/Wandsworth/cars/5/brand') === 'Ferrari');
        try {
            store.get('locations/Wandsworth/cars/3/brand');
            assert(false, "Should not have passed previous test");
        }
        catch (e) {

            if (e.message !== 'Path part [cars/3/brand] is not valid') {
                console.error(e);
                throw e;
            }
        }
        const cars = store.get('locations/Wandsworth/cars');
        assert(cars.length === 1);
        wandsworth.cars[6] = new Car(6, 'Kia', "Sportage", wandsworth.store);
        assert(store.get('locations/Wandsworth/cars/6/brand') === 'Kia');
    }
}

export default tests;