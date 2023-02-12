
export function assert(condition, message=null) {
    if (!condition)
        throw new Error(message == null ? "ASSERTION FAILED" : `ASSERTION FAILED: ${message}`);
}

export function assert_arrays_are_equal(a1, a2, message=null) {
    if (!are_arrays_equal(a1, a2))
        throw new Error(message == null ? "ASSERTION FAILED" : `ASSERTION FAILED: ${message}`);
}

function are_arrays_equal(a1, a2) {
    // if the other array is a falsy value, return
    if (!a1)
        return false;
    // if the argument is the same a1, we can be sure the contents are same as well
    if(a1 === a2)
        return true;
    // compare lengths - can save a lot of time
    if (a2.length !== a1.length)
        return false;

    for (let i=0; i < a2.length; i++) {
        // Check if we have nested arrays
        if (a2[i] instanceof Array && a1[i] instanceof Array) {
            // recurse into the nested arrays
            if (!are_arrays_equal(a2[i], a1[i]))
                return false;
        }
        else if (a2[i] != a1[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
}