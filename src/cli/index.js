import program from 'commander';
import path from 'path';
import fs from 'fs';

class cli {
  constructor() {
    this.pkg = fs.readFileSync(path.join(__dirname, '..', '..', 'package.json', 'utf8'));
    program
      .version(this.pkg.version)
      .option('-l, --listen <[host:]port>', 'host:port number to listen on (default: localhost:4873)')
      .option('-c, --config <config.yaml>', 'use this configuration file (default: ./config.yaml)');
  }

  run() {

  }

}

export default cli;
