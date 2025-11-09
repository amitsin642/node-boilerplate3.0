// src/utils/logger.js
import winston from "winston";
import "winston-daily-rotate-file";
import path from "path";
import fs from "fs";
import config from "../config/config.js";

// Ensure logs directory exists
const logDir = path.resolve(process.cwd(), "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
});

// Define transports
const transports = [];

// 1. Daily rotate file for error logs
transports.push(
  new winston.transports.DailyRotateFile({
    filename: path.join(logDir, "error-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    level: "error",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "30d",
  })
);

// 2. Daily rotate file for all logs
transports.push(
  new winston.transports.DailyRotateFile({
    filename: path.join(logDir, "app-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "30d",
  })
);

// 3. Console transport (with color for dev)
if (config.env !== "production") {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// Create logger
const logger = winston.createLogger({
  level: config.logging.level || "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }), // show stack trace for errors
    winston.format.splat(),
    winston.format.json(),
    logFormat
  ),
  transports,
  exitOnError: false, // prevent process exit on handled exceptions
});

// Log uncaught exceptions separately
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join(logDir, "exceptions.log"),
  })
);

// Log unhandled promise rejections
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Promise Rejection:", reason);
});

export default logger;
