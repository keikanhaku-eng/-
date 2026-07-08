export function random(from, to, interpolation) {
    let start;
    let end;
    let interp;
    if (from === undefined) {
        start = 0;
        end = 1;
    }
    else if (from !== undefined && to === undefined) {
        end = from;
        start = 0;
    }
    else {
        start = from;
        end = to;
    }
    const delta = end - start;
    if (interpolation === undefined) {
        interp = (n) => n;
    }
    else {
        interp = interpolation;
    }
    return start + interp(Math.random()) * delta;
}
export function chance(c) {
    return random() <= c;
}
