import {assert, assert_arrays_are_equal} from "./helpers/Assert.js";
import {set_test_request_data} from "./helpers/FakeFetch.js"
import Location from "./fixtures/Location.js";
import Car from "./fixtures/Car.js";
import Wheel from "./fixtures/Wheel.js";
import populate_store from "./fixtures/DataModel.js";
import Engine from "./fixtures/Engine.js";
import global_store from "../src/GlobalStore.js";

const tests = {

    test_reordering() {
        populate_store();

        const expected_values_location = [
            {
                property_name: 'Zanzibar',
                change: 'add',
                test_current_value: (current_value) => assert(current_value === undefined),
                test_new_value: (new_value) => assert(new_value.location === 'Zanzibar')
            },
            {
                property_name: 'locations',
                change: 'change',
                test_current_value: (current_value) => assert(current_value.length === 2),
                test_new_value: (new_value) => assert(new_value.length === 3)
            },
            {
                property_name: 'Azerbaijan',
                change: 'add',
                test_current_value: (current_value) => assert(current_value === undefined),
                test_new_value: (new_value) => assert(new_value.location === 'Azerbaijan')
            },
            {
                property_name: 'locations',
                change: 'change',
                test_current_value: (current_value) => assert(current_value.length === 3),
                test_new_value: (new_value) => assert(new_value.length === 4)
            },
            {
                property_name: 'locations',
                change: 'change',
                test_current_value: (current_value) => {
                    assert(current_value[0].location === 'Wandsworth');
                    assert(current_value.length === 4);
                },
                test_new_value: (new_value) => {
                    assert(new_value[0].location === 'Azerbaijan');
                    assert(new_value.length === 4);
                }
            }
        ]
        let index_location = 0;

        global_store.subscribe(
            `locations`,
            (object, property_name, current_value, new_value, change) => {
                assert(expected_values_location[index_location].property_name === property_name);
                assert(expected_values_location[index_location].change === change);
                expected_values_location[index_location].test_current_value(current_value);
                expected_values_location[index_location].test_new_value(new_value);
                index_location += 1;
        });

        global_store.set('locations/Zanzibar', new Location('Zanzibar', 'Fantastic Motors', 'locations/Zanzibar'));
        global_store.set('locations/Azerbaijan/', new Location('Azerbaijan', 'Wonderful Vehicles', 'locations/Azerbaijan/'));

        let index = 0;
        global_store.subscribe(
            `locations/Azerbaijan`,
            (object, property_name, current_value, new_value, change) => {
                index += 1;
        });

        function sort_compare_strings(a, b) {
            if (a.location < b.location)
                return -1;
            if (a.location > b.location)
                return 1;
            return 0;
        }

        let keys = global_store.get('locations').map(item => item.store.get_id());
        assert_arrays_are_equal(keys, ['Wandsworth', 'Croydon', 'Zanzibar', 'Azerbaijan']);
        const sorted = global_store.get('locations').sort(sort_compare_strings);
        keys = sorted.map(item => item.store.get_id());
        assert_arrays_are_equal(keys, ['Azerbaijan', 'Croydon', 'Wandsworth', 'Zanzibar', ]);
        global_store.set('locations', sorted);
        keys = global_store.get('locations').map(item => item.store.get_id());
        assert_arrays_are_equal(keys, ['Azerbaijan', 'Croydon', 'Wandsworth', 'Zanzibar', ]);
        assert(index_location === expected_values_location.length, `Only [${index_location}] happened`);
        assert(index === 0, `[${index}] happened`);
    }
}

export default tests;