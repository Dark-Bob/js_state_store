
## TODO

* Make array prxy add new objects
* Make API subscription manager
* Reference Objects (Maybe use a ReferenceStore that has a path, or a ReferenceObjectMap, ReferenceList)
* Reference object lists
* Custom sorting

How does path work?

We can set full path

We can register objects without parents awaiting_parent[parent_path] = [object_list]

Should remove set_id? Probably need it to know the variable name for API requests, setting, etc.

Make update from json loop through the incoming json, then if the object doesn't exist add / delete it, if it needs to be reordered do it. Then if it's unprocessed delete it.