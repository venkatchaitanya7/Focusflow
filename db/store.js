// Simplest possible store: keep sessions in a Map (works for a single-process free-tier deployment).
const Map = require('Map');
module.exports = new Map();
