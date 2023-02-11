const fs = require('fs');

function fetch_table(pc) {
  return JSON.parse(fs.readFileSync(`./lookupTables/x${pc}xlookupTable.json`));
}

export{ fetch_table };
