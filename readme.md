
# JS State Store
### A web component state store in VanillaJS

## Why did I write another state store?

* Nesting to match REST API best practice / Less data wrangling as 
data is the same shape 
* Since state often reflects the state in an API, providing the 
hooks to make that fully automated
* One data / DOM model, less duplication
* I hate boilerplate, so minimal boilerplate
* No store with good integration for VanillaJS / Web Components


The main motivation for writing this state store was that while the 
standard for REST API interfaces is to [use logical nesting on 
endpoints](https://stackoverflow.blog/2020/03/02/best-practices-for-rest-api-design/)
eg:

```REST
/api/location/London/cars/3954
```

Redux and Vuex both are designed to work with denormalized data. The 
creates a lot of code bloat to deal with the mismatching data structures 
and keep them in sync. I wanted to create a store that let me store 
and access the data naturally in a similarly nested store with minimal 
overhead. eg:

```javascript
const car = global_store.get('location/London/cars/3954');
```

I looked at MobX and MobX State Tree and while there is quite a lot to 
like about it, I really didn't like that I was creating a parallel state 
tree to my DOM tree. So I created a new option, where we can define a
store as part of our element. So we have one tree for DOM and state. eg:

```javascript
export default class Car extends HTMLElement {

    static id_member_name = 'id';
    static create_from_json(object_json, store_path) {
        return new Car(object_json.id, object_json.brand, object_json.model, object_json.price, store_path);
    }

    constructor(id, brand, model, price, store_path) {
        super();
        this.store = new Store({object: this, path: store_path, actions: api_actions_object});
        this.store.set_id(Car.id_member_name, id);
        this.store.set_member('brand', brand, '#brand');
        this.store.set_member('model', model, '#model');
        this.store.set_member('price', price, '#price');
        this.store.set_member('engine', new Engine('twin-turbo V8', `${store_path}/engine`), 'slot[name=engine]');
        this.store.set_member_array('wheels', [
            new Wheel('front-right'),
            new Wheel('front-left'),
            new Wheel('rear-right'),
            new Wheel('rear-left')], 'slot[name=wheels]');
    }

    connectedCallback() {
        if (!this.shadowRoot) {
            this.attachShadow({mode: 'open'});
            const template_element = template.content.cloneNode(true);
            this.shadowRoot.appendChild(template_element);
            this.store.synchronize_dom();
        }
    }
}

global_store.register_create_from_json_function("locations/.*/cars$", Car.create_from_json, Car.id_member_name);
window.customElements.define('k-car', Car);
```
Here we create a store object `this.store = new Store()`, with a 
globally unique path `store_path`, if it's not unique it just 
overwrites the other object. After that we set up the object's id. 
This is the unique identifier for this object if it's in an array, 
map, etc. `this.store.set_id('id', id)`.
The other members that make up the object's state, are declared with
`set_member, set_member_map, set_member_array`.

### Get / Set

Once the state is setup we can get and set it very easily. Inside the 
object we just use this. eg:

```javascript
// after this.store.set_member('brand', 'Mercedes');
console.log(this.brand); // prints: Mercedes
this.brand = 'Porche';
console.log(this.brand); // prints: Porche
```
From other objects we have a bunch of options. eg:

```javascript
const brand = global_store.get('location/London/cars/3954/brand');
global_store.set('location/London/cars/3954/brand', 'Porche');
global_store.get('location/London/cars/3954').brand = 'Porche';
const cars = global_store.get('location/London/cars');
cars['3954'].brand = 'Porche';
```

### Subscriptions

Often various DOM objects want to track the state of various parts of 
the state tree to be able to react. eg:
```javascript
function callback(object, property_name, current_value, new_value, change) {
    console.log(`Was ${current_value}, now ${new_value}`)
}

global_store.subscribe('location/London/cars', callback);
```
For member functions don't forget that you often want to bind this in the constructer. eg:
```javascript
class Something extends HTMLElement {
    constructor(cars, store_path) {
        this.store = new Store({object: this, path: store_path});
        this.store.set_member_map('cars', cars);
        // Bind this, so future callbacks get the this pointer
        this.on_change = this.on_change.bind(this);
    }
    
    on_change(object, property_name, current_value, new_value, change) {
        console.log(`Was ${current_value}, now ${new_value}`)
    }
    
    connectedCallback() {
        // We can subscirbe to our store without the full path
        this.store.subscribe('cars', this.on_change);
    }
    
    disconnectedCallback() {
        this.store.unsubscribe('cars', this.on_change);
    }
}
```
### Get JSON / Set JSON
Dealing with state as the actual element objects is nice and all but 
for interacting with APIs sometimes we need to be able to get and set 
JSON. For that we have the `get_json` and `set_json` methods. eg:
```javascript
global_store.get_json('location/London/cars/3954');
global_store.set_json('location/London/cars/3954', {brand: 'Porche'});
// Create / replace an object
global_store.set_json('location/London/cars/9999', {id: 9999, brand: 'Porche', model: 'Cayan', price: 40_000});
// Set / replace a list of objects
global_store.set_json('location/London/cars', [
    {id: 0, brand: 'Porche', model: 'Cayan', price: 40_000},
    {id: 1, brand: 'Lamborghini', model: 'Diablo', price: 90_000}
]);
```
You might have noticed that under our cars object we had this line
```javascript
global_store.register_create_from_json_function("locations/.*/cars$", Car.create_from_json, Car.id_member_name);
```
This allows us to register a creation function for a particular path 
in our store. So if someone sets some JSON and the path patches, 
then the creation function set here gets used. The string here is 
just a standard regex that uses the `.*` to match any id and the 
`$` ensures that it doesn't match longer urls.

When we set_json to update an existing object, it tries to merge 
objects and ignore state that is not actually different. This means 
if you have an API call that returns JSON state you can just set the 
whole object and the store will smart update. You can update outer 
and nested objects at the same time, whatever you pass in, it will 
match.
### Actions
You might have noticed the complete lack of boilerplate, mutators and 
things like that. I've taken the approach of trusting the coder to be 
a smart person. That said often we need to use "actions" where we can 
dispatch a write but only commit it once the API has been called 
successfully or something like that. eg:
```javascript
export const api_actions_map = {
    add(store, state) {
        const [create_from_json_function, id_property_name] = global_store.get_create_from_json_function(store.get_object_path());
        // We mirror the same path on the API
        const promise = fetch_post_json(store.get_object_url(), state);
        promise.then((object_json) => {
            const object = create_from_json_function(object_json, `${store.get_object_path()}/${object_json[id_property_name]}`);
            store.object[object.store.get_id()] = object;
        });
        return promise;
    },
    remove(store, state) {
        const [create_from_json_function, id_property_name] = global_store.get_create_from_json_function(store.get_object_path());
        // We mirror the same path on the API
        const promise = fetch_delete_json(`${store.get_object_url()}/${state[id_property_name]}`);
        promise.then((object_json) => {
            delete store.object[state[id_property_name]];
        });
        return promise;
    }
};
```
Above we have some a set of API actions for a map type store but you 
can create whatever actions you like. These are passed into the 
actions parameter on the `Store` constructor.
```javascript
this.store = new Store({object: this, path: store_path, actions: api_actions_object});
```
To trigger an action we call the action function on the store.
```javascript
// Within an object
this.store.action('add', 'cars', {id: 1, brand: 'Lamborghini', model: 'Diablo', price: 90_000});
// Globally
global_store.action('add', 'location/London/cars', {id: 1, brand: 'Lamborghini', model: 'Diablo', price: 90_000});
```
Both of these would call the add action defined above, this in turn 
would try to create an object on the API, assuming that the POST 
method is how an object is created. It would wait for that to return
then update the store. the promise is also returned so the calling 
code can take actions. eg:
```javascript
this.store.action('add', 'cars', {id: 1, brand: 'Lamborghini', model: 'Diablo', price: 90_000})
    .then(() => console.log('Success'))
    .catch(error => console.error(new Error(error)));
```
You might have also noticed the store function `get_object_url()`. 
As part of the desire for coders who write very consistent 
interfaces to not have to keep writing boilerplate, I wanted a way 
for us to use the close mapping of REST API and store structure to 
minimise that further. As such you can set a base url for the 
`global_store`.
```javascript
global_store.set_base_url('api/v1');
```
This then get prepended to the object path, so:

object_path: `location/London/cars/3954` -> object_url: `api/v1/location/London/cars/3954`

Sometimes for display purposes, we'll have extra parts of our 
hybrid DOM / state tree. So if we had a container element with a 
store for our `locations`, say `locations_container`. Then our 
state store object paths might be.

object_path: `locations_container/location/London/cars/3954`

Where 'locations_container' does not exist on the API / data 
model level. When we create a store we can let it know if it 
should form part of the url or not.
```javascript
this.store = new Store({object: this, path: 'locations_container', actions: api_actions_object, is_part_of_url: false});
```
By setting `is_part_of_url=false`, we get:

object_path: `locations_container/location/London/cars/3954` -> object_url: `api/v1/location/London/cars/3954`

Our APIs use:
* POST - Create -> Pass JSON of object state
* GET - List objects / get object depending on if it's called on 
the noun `api/v1/locations` or the id `api/v1/locations/London` -> Returns JSON of object state
* DELETE - Delete object eg: `api/v1/locations/London`
* PATCH - Update object -> Pass JSON key value pairs of what object parameters to update

If your API matches then fantastic you can just pass in our actions 
as is, and you only need the one set of actions for your entire 
state tree.
### API Subscription Manager
Sometimes there are lists of objects that we need to monitor, to 
ensure that we're displaying the latest data. For this we have the 
`ApiSubscriptionManager`.
We just set it up listen to a path and it will keep the state updated 
for us.
```javascript
api_subscription_manager.subscribe('locations');
// Subscribe to nested lists
api_subscription_manager.subscribe('locations/London/cars');
api_subscription_manager.unsubscribe('locations');
```


---
## Setup / Install / Getting Started
The simplest way is just to import the files for the CDN eg:
```javascript
import global_store from "https://cdn.jsdelivr.net/gh/Dark-Bob/js_state_store@c9b3060/src/GlobalStore.js";
import Store from "https://cdn.jsdelivr.net/gh/Dark-Bob/js_state_store@c9b3060/src/Store.js";
import {api_actions_object, api_actions_map} from "https://cdn.jsdelivr.net/gh/Dark-Bob/js_state_store@c9b3060/src/ApiActions.js";
```
The bit after the @ symbol the git commit hash, so ue that to select 
your version of the store.

If you're using Webpack, then you might need to enable external 
imports. In your `webpack.config.js` file set:
```javascript
module.exports = {
    ...
    output: {
        ...
        environment: {
            module: true,
            dynamicImport: true,   // Note you need to enable `dynamicImport ` here
        }
    },
    ...
};
```
