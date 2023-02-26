import {assert, assert_arrays_are_equal} from "./helpers/Assert.js";
import {set_test_request_data} from "./helpers/FakeFetch.js"
import Location from "./fixtures/Location.js";
import Car from "./fixtures/Car.js";
import Wheel from "./fixtures/Wheel.js";
import populate_store from "./fixtures/DataModel.js";
import Engine from "./fixtures/Engine.js";
import global_store from "../src/GlobalStore.js";
import api_subscription_manager from "../src/ApiSubscriptionManager.js";

const tests = {

    async test_api_subscription_manager() {
        populate_store();

        function sort_compare_strings(a, b) {
            if (a.location < b.location)
                return -1;
            if (a.location > b.location)
                return 1;
            return 0;
        }

        // Create data to be returned from the mocked API
        const locations_json = {method: 'get', url: 'api/v1/locations', data: {locations: global_store.get_json('locations')}};
        const new_locations = {method: 'get', url: 'api/v1/locations', data: {locations: [...locations_json.data.locations, {location: 'Zanzibar', description: 'Fantastic Motors'}, {location: 'Azerbaijan', description: 'Wonderful Vehicles'}]}};
        const sorted_locations = {method: 'get', url: 'api/v1/locations', data: {locations: [...new_locations.data.locations].sort(sort_compare_strings)}};
        const test_request_data = [
            locations_json,
            locations_json,
            new_locations,
            sorted_locations,
            sorted_locations
        ];

        set_test_request_data(test_request_data);

        // 5 updates but only 3 change the state
        const expected_values = [
            {
                property_name: 'Zanzibar',
                change: 'add',
                test_current_value: (current_value) => assert(current_value === undefined),
                test_new_value: (new_value) => assert(new_value.location === 'Zanzibar')
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
                test_current_value: (current_value) => assert(current_value[0].location = 'Wandsworth'),
                test_new_value: (new_value) => assert(new_value[0].location === 'Azerbaijan')
            }
        ]
        let index = 0;

        global_store.subscribe(
            `locations`,
            (object, property_name, current_value, new_value, change) => {
                assert(expected_values[index].property_name === property_name);
                assert(expected_values[index].change === change);
                expected_values[index].test_current_value(current_value);
                expected_values[index].test_new_value(new_value);
                index += 1;
        });

        api_subscription_manager.subscribe('locations', Location.create_from_json);
        const api_poll_frequency = 2000;
        await new Promise((resolve, reject) => setTimeout(resolve, test_request_data.length * api_poll_frequency + 200));
        api_subscription_manager.unsubscribe('locations');
        assert(index === 3, `[${index}] happened`);
    }
}

export default tests;