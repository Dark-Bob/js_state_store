import {assert} from "./helpers/Assert.js";
import {set_test_request_data} from "./helpers/FakeFetch.js"
import Car from "./fixtures/Car.js";
import populate_store from "./fixtures/DataModel.js";

const tests = {
    test_simple_variable() {
        const store = populate_store();

        store.set('selected_id', 1);
        assert(store.get('selected_id') === 1);
    }
}

export default tests;