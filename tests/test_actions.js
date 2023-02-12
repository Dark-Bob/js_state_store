import {assert} from "./helpers/Assert.js";
import {set_test_request_data} from "./helpers/FakeFetch.js"
import Car from "./fixtures/Car.js";
import populate_global_store from "./fixtures/DataModel.js";
import Location from "./fixtures/Location.js";
import global_store from "../src/GlobalStore.js";

const tests = {
    async test_update_action() {
        populate_global_store();

        let num_calls = 0;

        global_store.subscribe(
            `locations/Wandsworth/cars/0/brand`,
            (object, property_name, current_value, new_value, change) => {
                assert(current_value === 'Ferrari');
                assert(new_value === 'Toyota');
                assert(property_name === 'brand');
                num_calls++;
        });

        global_store.subscribe(
            `locations/Wandsworth/cars/0`,
            (object, property_name, current_value, new_value, change) => {
                assert(current_value === 'Ferrari');
                assert(new_value === 'Toyota');
                assert(property_name === 'brand');
                num_calls++;
        });

        global_store.subscribe(
            `locations/Wandsworth/cars/0/model`,
            (object, property_name, current_value, new_value, change) => {
                assert(false, 'This should not trigger');
        });

        const promise = await global_store.action('update', 'locations/Wandsworth/cars/0', {'brand': 'Toyota'});
        console.log(promise)
        assert(num_calls === 2, `Only [${num_calls}] happened`);
    },

    async test_add_remove_action() {
        populate_global_store();

        let num_calls = 0;

        global_store.subscribe(
            `locations`,
            (object, property_name, current_value, new_value, change) => {
                assert(property_name === 'Knightsbridge');
                assert(current_value === undefined);
                assert(new_value.location === 'Knightsbridge');
                assert(new_value.description === 'We sell cars');
                num_calls++;
        });

        global_store.subscribe(
            `locations/Wandsworth/cars`,
            (object, property_name, current_value, new_value, change) => {
                assert(property_name === '0');
                assert(new_value === undefined);
                assert(current_value.id === 0);
                assert(current_value.brand === 'Ferrari');
                assert(current_value.model === 'F40');
                num_calls++;
        });

        await global_store.action('add', 'locations', {location: 'Knightsbridge', description: 'We sell cars'});
        await global_store.action('remove', 'locations/Wandsworth/cars', {id: 0});
        // Should not trigger anything
        const promise = await global_store.action('update', 'locations/Wandsworth/cars/1', {'brand': 'Toyota'});
        assert(num_calls === 2, `Only [${num_calls}] happened`);
    }
}

export default tests;