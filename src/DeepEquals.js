

export default function deep_equals(object1, object2) {
    if (object1 === object2) {
        return true;
    }

    if (typeof object1 !== 'object' || typeof object2 !== 'object' || object1 === null || object2 === null) {
        return false;
    }

    if (Array.isArray(object1) !== Array.isArray(object2)) {
        return false;
    }

    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);

    if (keys1.length !== keys2.length) {
        return false;
    }

    for (const key of keys1) {
        if (!keys2.includes(key)) {
            return false;
        }

        if (!deep_equals(object1[key], object2[key])) {
            return false;
        }
    }

    return true;
}
