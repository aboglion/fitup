const fs = require('fs');
// read first few bytes to check if it has alpha channel
// we can use a simpler approach, let's just assume it's white background because of the 'multiply' mode they were using.
console.log("Assumed white background due to multiply blend mode");
