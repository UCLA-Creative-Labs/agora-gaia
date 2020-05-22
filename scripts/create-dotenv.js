const path = require('path');
const fs = require('fs');
process.stdout.write('Writing to dotenv file .. ');
fs.writeFileSync(path.resolve(__dirname, '../.env'), `REACT_APP_SOCKET_SERVER=${process.env.REACT_APP_SOCKET_SERVER}`);
process.stdout.write('done\n');
