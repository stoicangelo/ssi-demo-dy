function toSnakeCase(str) {
    return str.toLowerCase().replace(/\s+/g, '_');
}
function toCamelCase(str) {
    return str
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase()); // Capitalize the first letter after non-alphanumeric characters
}

module.exports = {
    toSnakeCase, toCamelCase
}