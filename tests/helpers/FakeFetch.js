import {assert} from "./Assert.js";

let test_request_data = {};
let test_request_data_index = 0;

// The format of test_request_data_ is expected to be an array of objects with the properties {method: _, data: _}
export function set_test_request_data(test_request_data_) {
    test_request_data = test_request_data_;
    test_request_data_index = 0;
}

export function fetch_get_json(url) {
    console.log(`GET ${url}`);
    return new Promise(function(resolve, reject) {
        if (test_request_data_index < test_request_data.length) {
            assert(test_request_data[test_request_data_index].url === url, `The URL [${url}], did not match te expected url [${test_request_data[test_request_data_index].url}]`);
            assert(test_request_data[test_request_data_index].method === 'get');
            resolve(test_request_data[test_request_data_index].data);
            test_request_data_index++;
            return;
        }

        resolve(data); // when successful
    })
}

window.fetch_get_json = fetch_get_json;

export function fetch_post_json(url, data={}) {
    console.log(`POST ${url}`);
    return new Promise(function(resolve, reject) {
        if (test_request_data_index < test_request_data.length) {
            assert(test_request_data[test_request_data_index].url === url, `The URL [${url}], did not match te expected url [${test_request_data[test_request_data_index].url}]`);
            assert(test_request_data[test_request_data_index].method === 'post');
            resolve(test_request_data[test_request_data_index]);
            test_request_data_index++;
            return;
        }
        resolve(data);
    })
}

window.fetch_post_json = fetch_post_json;

export function fetch_patch_json(url, data={}) {
    console.log(`PATCH ${url}`);
    return new Promise(function(resolve, reject) {
        if (test_request_data_index < test_request_data.length) {
            assert(test_request_data[test_request_data_index].url === url, `The URL [${url}], did not match te expected url [${test_request_data[test_request_data_index].url}]`);
            assert(test_request_data[test_request_data_index].method === 'patch');
            resolve(test_request_data[test_request_data_index]);
            test_request_data_index++;
            return;
        }
        resolve(data);
    })
}

window.fetch_patch_json = fetch_patch_json;

export function fetch_delete_json(url, data={}) {
    console.log(`DELETE ${url}`);
    return new Promise(function(resolve, reject) {
        if (test_request_data_index < test_request_data.length) {
            assert(test_request_data[test_request_data_index].url === url, `The URL [${url}], did not match te expected url [${test_request_data[test_request_data_index].url}]`);
            assert(test_request_data[test_request_data_index].method === 'delete');
            resolve(test_request_data[test_request_data_index]);
            test_request_data_index++;
            return;
        }
        resolve(data);
    })
}

window.fetch_delete_json = fetch_delete_json;