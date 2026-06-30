const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.DailyRotateFile({
      filename: path.join(__dirname, '../../logs/app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      zippedArchive: true
    })
  ]
});

module.exports = logger;
