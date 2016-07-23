import { createWriteStream } from 'fs';
import bunyan from 'bunyan';
import Error from 'http-errors';
import Stream from 'stream';
import Validators from './Validators';

const escapeChar = 0o33;

const colorLevels = {
  fatal: 31,
  error: 31,
  warn: 33,
  http: 35,
  info: 36,
  debug: 90,
  trace: 90
};

const subSystems = [
  {
    in      : `${escapeChar}[32m<--${escapeChar}[39m`,
    out     : `${escapeChar}[33m-->${escapeChar}[39m`,
    fs      : `${escapeChar}[90m-=-${escapeChar}[39m`,
    default : `${escapeChar}[34m---${escapeChar}[39m`
  }, {
    in      : '<--',
    out     : '-->',
    fs      : '-=-',
    default : '---'
  }
];

function rightPad(str, obj, char) {
  let max = 0;
  for (var o in obj) {
    max = Math.max(max, o.length);
  }

  if (str.length < max) {
    return str + char.repeat(max - str.length);
  }
  return str;
}

class Logger {
  constructor() {
    this.streams = [];
  }

  setup(logs) {
    if (logs === null) {
      logs = [{
        type: 'stdout',
        format: 'pretty',
        level: 'http'
      }];
    }

    logs.forEach((target) => {
      const stream = new Stream();
      stream.writable = true;

      if (target.type === 'stdout' || target.type === 'stderr') {
        const dest = (target.type === 'stdout') ? process.stdout : process.stderr;

        if (target.format === 'pretty') {
          stream.write = (obj) => {
            dest.write(this.print(obj.level, obj.msg, obj, dest.isTTY) + '\n');
          };
        } else {
          stream.write = (obj) => {
            dest.write(JSON.stringify(obj, bunyan.safeCycles()) + '\n');
          };
        }
      } else if (target.type === 'file') {
        const dest = createWriteStream(target.path, {
          flags: 'a',
          encoding: 'utf8'
        });

        dest.on('error', (err) => {
          bunyan.emit('error', err);
        });

        stream.write = (obj) => {
          if (target.format === 'pretty') {
            dest.write(print(obj.level, obj.msg, obj, false) + '\n');
          } else {
            dest.write(JSON.stringify(obj, bunyan.safeCycles()) + '\n');
          }
        };
      } else {
        throw Error('wrong target type for a log');
      }

      if (target.level === 'http') {
        target.level = 35;
      }

      this.streams.push({
        type: 'raw',
        level: target.level || 35,
        stream: stream
      });
    });
  }

  static getLevel(level) {
    switch (level) {
    case level < 15:
      return 'trace';
    case level < 25:
      return 'debug';
    case level < 35:
      return 'info';
    case level === 35:
      return 'http';
    case level < 45:
      return 'warn';
    case level < 55:
      return 'error';
    default:
      return 'fatal';
    }
  }

  static print(type, msg, obj, colors) {
    if (typeof type === 'number') {
      type = this.getLevel(type);
    }
    var finalMsg = msg.replace(/@{(!?[$A-Za-z_][$0-9A-Za-z\._]*)}/g, function(_, name) {
      var str = obj, is_error;
      if (name[0] === '!') {
        name = name.substr(1);
        is_error = true;
      }

      var _ref = name.split('.');
      for (var _i = 0; _i < _ref.length; _i++) {
        var id = _ref[_i];
        if (Utils.is_object(str) || Array.isArray(str)) {
          str = str[id];
        } else {
          str = undefined;
        }
      }

      if (typeof(str) === 'string') {
        if (!colors || str.includes('\n')) {
          return str;
        } else if (is_error) {
          return `${escapeChar}[31m${str}${escapeChar}[39m`;
        } else {
          return `${escapeChar}[32m${str}${escapeChar}[39m`;
        }
      } else {
        return require('util').inspect(str, null, null, colors);
      }
    });

    var sub = subSystems[colorLevels ? 0 : 1][obj.sub] || subSystems[+!colorLevels].default;
    if (colors) {
      return ' ' + escapeChar + '[' + colorLevels[type] + 'm' + (rightPad(type, colorLevels, ' ')) + escapeChar + '[39m ' + sub + ' ' + finalMsg;
    } else {
      return ' ' + (rightPad(type, colorLevels, ' ')) + ' ' + sub + ' ' + finalMsg;
    }
  }
}
