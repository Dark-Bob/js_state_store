import {assert} from "./helpers/Assert.js";
import {set_test_request_data} from "./helpers/FakeFetch.js"
import Location from "./fixtures/Location.js";
import Car from "./fixtures/Car.js";
import Wheel from "./fixtures/Wheel.js";
import populate_store from "./fixtures/DataModel.js";
import Engine from "./fixtures/Engine.js";

const tests = {
    test_subscriptions() {
        const store = populate_store();

        store.subscribe(
            `locations/Wandsworth/cars/0/brand`,
            (object, property_name, current_value, new_value, change) => {
                assert(current_value === 'Ferrari');
                assert(new_value === 'Toyota');
                assert(property_name === 'brand');
        });
        store.subscribe(
            `locations/Wandsworth/cars/0`,
            (object, property_name, current_value, new_value, change) => {
                if (property_name === 'brand') {
                    assert(current_value === 'Ferrari');
                    assert(new_value === 'Toyota');
                    assert(property_name === 'brand');
                }
                else {
                    assert(current_value === 'F40');
                    assert(new_value === 'Hatchback');
                    assert(property_name === 'model');
                }
        });

        store.get('locations/Wandsworth/cars/0').brand = 'Toyota';
        console.log(`get: [${store.get('locations/Wandsworth/cars/0').brand}]`);

        store.get('locations/Wandsworth/cars/1').brand = 'Mazda';
        store.get('locations/Wandsworth/cars/0').model = 'Hatchback';
    },

    test_subscriptions_object() {
        const store = populate_store();

        const expected_values_type = [
            {
                property_name: 'type',
                change: 'change',
                test_current_value: (current_value) => assert(current_value === 'twin-turbo V8'),
                test_new_value: (new_value) => assert(new_value === '2.0L 4-cylinder')
            },
            {
                property_name: 'type',
                change: 'change',
                test_current_value: (current_value) => assert(current_value === '2.0L 4-cylinder'),
                test_new_value: (new_value) => assert(new_value === "1.5L 4-cylinder")
            }
        ]
        let index_type = 0;

        store.subscribe(
            `locations/Wandsworth/cars/0/engine/type`,
            (object, property_name, current_value, new_value, change) => {
                assert(expected_values_type[index_type].property_name === property_name);
                assert(expected_values_type[index_type].change === change);
                expected_values_type[index_type].test_current_value(current_value);
                expected_values_type[index_type].test_new_value(new_value);
                index_type += 1;
        });

        const expected_values_engine = [
            {
                property_name: 'type',
                change: 'change',
                test_current_value: (current_value) => assert(current_value === 'twin-turbo V8'),
                test_new_value: (new_value) => assert(new_value === '2.0L 4-cylinder')
            },
            {
                property_name: 'type',
                change: 'change',
                test_current_value: (current_value) => assert(current_value === '2.0L 4-cylinder'),
                test_new_value: (new_value) => assert(new_value === "1.5L 4-cylinder")
            },
            {
                property_name: 'engine',
                change: 'change',
                test_current_value: (current_value) => assert(current_value.type === '1.5L 4-cylinder'),
                test_new_value: (new_value) => assert(new_value.type === '3.0L 6-cylinder')
            }
        ]
        let index_engine = 0;
        store.subscribe(
            `locations/Wandsworth/cars/0/engine`,
            (object, property_name, current_value, new_value, change) => {
                assert(expected_values_engine[index_engine].property_name === property_name);
                assert(expected_values_engine[index_engine].change === change);
                expected_values_engine[index_engine].test_current_value(current_value);
                expected_values_engine[index_engine].test_new_value(new_value);
                index_engine += 1;
        });

        store.set('locations/Wandsworth/cars/0/engine/type', '2.0L 4-cylinder');
        assert(store.get('locations/Wandsworth/cars/0/engine/type') === '2.0L 4-cylinder');
        store.get('locations/Wandsworth/cars/0/engine').type = '1.5L 4-cylinder';
        assert(store.get('locations/Wandsworth/cars/0/engine/type') === '1.5L 4-cylinder');
        store.set('locations/Wandsworth/cars/0/engine/', new Engine('3.0L 6-cylinder', 'locations/Wandsworth/cars/0/engine/'));
        assert(store.get('locations/Wandsworth/cars/0/engine/type') === '3.0L 6-cylinder');
        assert(index_type === expected_values_type.length, `Only [${index_type}] tests ran, some subscriptions didn't fire.`);
        assert(index_engine === expected_values_engine.length, `Only [${index_engine}] tests ran, some subscriptions didn't fire.`);
    },

    test_subscriptions_object_maps() {
        const store = populate_store();

        store.subscribe(
            `locations`,
            (object, property_name, current_value, new_value, change) => {
                if (change !== 'add')
                    return;
                assert(property_name === 'Knightsbridge');
                assert(new_value instanceof Location);
        });

        store.set('locations/Knightsbridge', new Location('Knightsbridge', 'Bangers for sale', 'locations/Knightsbridge'));

        const expected_values = [
            {
                property_name: '2',
                change: 'add',
                test_current_value: (current_value) => assert(current_value === undefined),
                test_new_value: (new_value) => assert(new_value.brand === 'Toyota')
            },
            {
                property_name: 'cars',
                change: 'change',
                test_current_value: (current_value) => assert(current_value.length === 2),
                test_new_value: (new_value) => assert(new_value.length === 3)
            },
            {
                property_name: '0',
                change: 'remove',
                test_current_value: (current_value) => assert(current_value.brand === 'Ferrari'),
                test_new_value: (new_value) => assert(new_value === undefined)
            },
            {
                property_name: 'cars',
                change: 'change',
                test_current_value: (current_value) => assert(current_value.length === 3),
                test_new_value: (new_value) => assert(new_value.length === 2)
            },
            {
                property_name: '2',
                change: 'change',
                test_current_value: (current_value) => assert(current_value.brand === 'Toyota'),
                test_new_value: (new_value) => assert(new_value.brand === 'Mazda')
            },
            {
                property_name: 'cars',
                change: 'change',
                test_current_value: (current_value) => {
                    assert(current_value.length === 2);
                    assert(current_value[1].id === 2);
                    assert(current_value[1].brand === 'Mazda')
                },
                test_new_value: (new_value) => {
                    assert(new_value.length === 1);
                    assert(new_value[0].brand === 'Kia');
                }
            },
            {
                property_name: '4',
                change: 'add',
                test_current_value: (current_value) => assert(current_value === undefined),
                test_new_value: (new_value) => assert(new_value.brand === 'Kia')
            },
            {
                property_name: 'cars',
                change: 'change',
                test_current_value: (current_value) => assert(current_value.length === 2),
                test_new_value: (new_value) => assert(new_value.length === 1)
            }
        ]
        let index = 0;
        store.subscribe(
            `locations/Knightsbridge/cars`,
            (object, property_name, current_value, new_value, change) => {
                assert(expected_values[index].property_name === property_name);
                assert(expected_values[index].change === change);
                expected_values[index].test_current_value(current_value);
                expected_values[index].test_new_value(new_value);
                index += 1;
        });

        const knightsbridge = store.get('locations/Knightsbridge');
        knightsbridge.cars[2] = new Car(2, 'Toyota', 'Camri', 10_000, 'locations/Knightsbridge/cars/2');
        assert(knightsbridge.cars.length === 3);
        delete knightsbridge.cars[0];
        assert(knightsbridge.cars.length === 2);
        knightsbridge.cars[2] = new Car(2, 'Mazda', 'Mx5', 10_000, 'locations/Knightsbridge/cars/2');
        assert(knightsbridge.cars.length === 2);
        knightsbridge.cars = [new Car(4, 'Kia', 'Sportage', 10_000, 'locations/Knightsbridge/cars/4')];
        assert(index === expected_values.length, `Only [${index}] tests ran, some subscriptions didn't fire.`);
    },

    test_subscribe_list() {
        const store = populate_store();

        const expected_values = [
            {
                property_name: '4',
                change: 'add',
                test_current_value: (current_value) => { assert(current_value === undefined) },
                test_new_value: (new_value) => { assert(new_value.name === 'spare')}
            },
            {
                property_name: 'wheels',
                change: 'change',
                test_current_value: (current_value) => assert(current_value.length === 4),
                test_new_value: (new_value) => assert(new_value.length === 5)
            },
            {
                property_name: 'wheels',
                change: 'change',
                test_current_value: (current_value) => assert(current_value.length === 5),
                test_new_value: (new_value) => assert(new_value.length === 4)
            },
            {
                property_name: '3',
                change: 'remove',
                test_current_value: (current_value) => assert(current_value.name === 'rear-left'),
                test_new_value: (new_value) => assert(new_value === undefined)
            },
            {
                property_name: 'wheels',
                change: 'change',
                test_current_value: (current_value) => assert(current_value.length === 4),
                test_new_value: (new_value) => assert(new_value.length === 3)
            }
        ]
        let index = 0;
        store.subscribe(
            `locations/Wandsworth/cars/0/wheels`,
            (object, property_name, current_value, new_value, change) => {
                console.log(`property_name: [${property_name}]`);
                console.log(`change: [${change}]`);
                assert(expected_values[index].property_name === property_name);
                assert(expected_values[index].change === change);
                expected_values[index].test_current_value(current_value);
                expected_values[index].test_new_value(new_value);
                index += 1;
        });

        const car = store.get('locations/Wandsworth/cars/0');
        console.log("car.wheels.push(new Wheel('spare'));");
        car.wheels.push(new Wheel('spare'));
        console.log("car.wheels = car.wheels.filter((item) => item.name !== 'spare');");
        car.wheels = car.wheels.filter((item) => item.name !== 'spare');
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
        console.log("car.wheels.pop();");
        const wheel = car.wheels.pop();
        assert(wheel.name === 'rear-left');
        // Needs implementing
        // copyWithin()
        // fill()
        // reverse()
        // shift()
        // sort()
        // splice()
        // unshift()
        assert(index === expected_values.length, `Only [${index}] tests ran, some subscriptions didn't fire.`);
    },

    test_subscribe_before_create() {
        global_store.clear();

        const locations_expected_values = [
            {
                property_name: 'Wandsworth',
                change: 'add',
                test_current_value: (current_value) => assert(current_value === undefined),
                test_new_value: (new_value) => assert(new_value.location === 'Wandsworth')
            },
            {
                property_name: 'Croydon',
                change: 'add',
                test_current_value: (current_value) => assert(current_value === undefined),
                test_new_value: (new_value) => assert(new_value.location === 'Croydon')
            },
            {
                property_name: 'locations',
                change: 'change',
                test_current_value: (current_value) => assert(current_value.length === 0),
                test_new_value: (new_value) => assert(new_value.length === 2)
            },
            {
                property_name: 'Knightsbridge',
                change: 'add',
                test_current_value: (current_value) => assert(current_value === undefined),
                test_new_value: (new_value) => assert(new_value.location === 'Knightsbridge')
            },
            {
                property_name: 'locations',
                change: 'change',
                test_current_value: (current_value) => assert(current_value.length === 2),
                test_new_value: (new_value) => assert(new_value.length === 3)
            },
            {
                property_name: 'Wandsworth',
                change: 'add',
                test_current_value: (current_value) => assert(current_value === undefined),
                test_new_value: (new_value) => assert(new_value.location === 'Wandsworth')
            },
            {
                property_name: 'Croydon',
                change: 'add',
                test_current_value: (current_value) => assert(current_value === undefined),
                test_new_value: (new_value) => assert(new_value.location === 'Croydon')
            },
            {
                property_name: 'locations',
                change: 'change',
                test_current_value: (current_value) => assert(current_value.length === 3),
                test_new_value: (new_value) => assert(new_value.length === 2)
            }
        ];

        let locations_index = 0;
        global_store.subscribe(
            `locations`,
            (object, property_name, current_value, new_value, change) => {
                assert(locations_expected_values[locations_index].property_name === property_name);
                assert(locations_expected_values[locations_index].change === change);
                locations_expected_values[locations_index].test_current_value(current_value);
                locations_expected_values[locations_index].test_new_value(new_value);
                locations_index += 1;
        });

        populate_store();

        const original_values = global_store.get('locations');

        const expected_values = [
            {
                property_name: 'description',
                change: 'change',
                test_current_value: (current_value) => assert(current_value === 'Bangers for sale'),
                test_new_value: (new_value) => assert(new_value === 'Good motors')
            }
        ];

        let index = 0;
        global_store.subscribe(
            `locations/Knightsbridge`,
            (object, property_name, current_value, new_value, change) => {
                assert(expected_values[index].property_name === property_name);
                assert(expected_values[index].change === change);
                expected_values[index].test_current_value(current_value);
                expected_values[index].test_new_value(new_value);
                index += 1;
        });

        global_store.set('locations/Knightsbridge', new Location('Knightsbridge', 'Bangers for sale', 'locations/Knightsbridge'));
        global_store.set('locations/Knightsbridge/description', 'Good motors');
        global_store.set('locations', original_values);
        assert(index + locations_index === expected_values.length + locations_expected_values.length, `Only [${index + locations_index}] tests ran, some subscriptions didn't fire.`);
    }
}

export default tests;