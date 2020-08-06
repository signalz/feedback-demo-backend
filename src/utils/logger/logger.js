import winston, { format } from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import path from 'path'
import fs from 'fs'

const APP_NAME = 'FEEDBACK'
const LOGS_FOLDER = './logs/'
const { timestamp, label, printf, combine } = format

export const createLogFolder = (logsFolder = './logs/') => {
  let createdLogFolder = logsFolder

  if (!path.isAbsolute(createdLogFolder)) {
    createdLogFolder = path.resolve(process.cwd(), createdLogFolder)
  }
  if (!fs.existsSync(createdLogFolder)) {
    fs.mkdirSync(createdLogFolder)
  }

  return createdLogFolder
}

export const configureLogger = ({ logsFolder }) => {
  const currentLogsFolder = createLogFolder(logsFolder)

  const currentTransports = [
    new winston.transports.Console({
      colorize: true,
      level: 'info',
    }),
    new DailyRotateFile({
      filename: `${APP_NAME}.info`,
      dirname: currentLogsFolder,
      name: APP_NAME,
      level: 'info',
    }),
    new DailyRotateFile({
      filename: `${APP_NAME}.debug`,
      dirname: currentLogsFolder,
      name: `${APP_NAME}-debug`,
      level: 'debug',
    }),
  ]
  const myFormat = printf(
    (info) => `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`,
  )
  const logger = winston.createLogger({
    format: combine(
      label({
        label: APP_NAME,
      }),
      timestamp(),
      myFormat,
    ),
    transports: currentTransports,
  })
  logger.stream = {
    write: (message) => logger.info(message),
  }

  return logger
}

export const logger = configureLogger({
  logsFolder: LOGS_FOLDER,
})
