
class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = "NetworkError";
  }
}

window.NetworkError = NetworkError;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetch_with_retries(url, init, go_to_redirects=true, num_tries=5, is_json=true) {
    let response;
    let network_error;
    for (let i = 0; i < num_tries; i++) {
        try {
            response = await fetch(url, init);

            // Clear any error from an earlier attempt now that we've succeeded
            network_error = null;
            break;
        } catch (err) {
            // Catch network errors here and retry if we haven't exhausted the retry count yet
            console.log(`fetch_with_retries - attempt ${i} completed with network error [${err}], retrying`);
            network_error = err;
            await sleep(1000 + i * 1000);
        }
    }

    if (network_error === null) {
        if (go_to_redirects && response.redirected) {
            window.location.href = response.url;
            return;
        }
        if (response.ok) {
            if (is_json) {
                // Clone the response before parsing to json so that if an error occurs we can read the original
                return response.clone().json()
                    .catch(err => {
                        if (err instanceof SyntaxError) {
                            console.log(`There was an error parsing the response json for request ${response.url}`);
                            response.text().then(text => {
                                console.log(`The response text was: ${text}`);
                            })

                        }
                        throw err;
                    });
            }
            else
            {
                return response.text();
            }
        } else {
            // Other types of errors - e.g. 500 returned by the endpoint. Reject with the text content of the response.
            return response.text().then(text => {
                return Promise.reject(new Error(text));
            });
        }
    }
    else {
        // Reject network error caught earlier that we eventually gave up on
        return Promise.reject(new NetworkError("You appear to be having internet connection issues. Please check your connection and then refresh the page."));
    }
}

export async function fetch_get(url, go_to_redirect=true, num_retries=5) {
    return fetch_with_retries(url, { cache: 'no-store', follow:true }, go_to_redirect, num_retries, false);
}

window.fetch_get = fetch_get;

export async function fetch_get_json(url, go_to_redirect=true, num_retries=5) {
    return fetch_with_retries(url, { cache: 'no-store', follow:true }, go_to_redirect, num_retries, true);
}

window.fetch_get_json = fetch_get_json;


export async function fetch_post_json(url, data, go_to_redirect=true, num_retries=5) {
    return fetch_with_retries(url, {
            method: 'POST',
            headers: new Headers({
                    'Content-Type': 'application/json'
                }),
            cache: 'no-store',
            follow: true,
            body: JSON.stringify(data)
        },
        go_to_redirect,
        num_retries,
        true);
}

window.fetch_post_json = fetch_post_json;

export async function fetch_patch_json(url, data, go_to_redirect=true, num_retries=5) {
    return fetch_with_retries(url, {
            method: 'PATCH',
            headers: new Headers({
                'Content-Type': 'application/json'
            }),
            cache: 'no-store',
            follow: true,
            body: JSON.stringify(data)
        },
        go_to_redirect,
        num_retries,
        true);
}

window.fetch_patch_json = fetch_patch_json;

export async function fetch_delete_json(url, go_to_redirect=true, num_retries=5) {
    return fetch_with_retries(url, {
            method: 'DELETE',
            cache: 'no-store',
            follow: true
        },
        go_to_redirect,
        num_retries,
        true);
}

window.fetch_delete_json = fetch_delete_json;

export async function fetch_post_form_data(url, form_data, go_to_redirect=true, num_retries=5) {
    return fetch_with_retries(url, {
            method: 'POST',
            cache: 'no-store',
            follow: true,
            body: form_data
        },
        go_to_redirect,
        num_retries,
        true);
}

window.fetch_post_form_data = fetch_post_form_data;

