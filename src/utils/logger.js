/**
 * 日志记录工具模块
 * 功能：提供结构化的日志记录功能
 */

import fs from 'node:fs/promises';
import path from 'node:path';

export class Logger {
  constructor(options = {}) {
    this.outputDir = options.outputDir || './logs';
    this.filename = options.filename || `app-${new Date().toISOString().split('T')[0]}.log`;
    this.logLevel = options.logLevel || 'info';
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile !== false;
    
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    this.currentLevel = this.levels[this.logLevel] || this.levels.info;
    
    // 确保日志目录存在
    this.ensureLogDirectory();
  }

  /**
   * 确保日志目录存在
   */
  async ensureLogDirectory() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error('创建日志目录失败:', error.message);
    }
  }

  /**
   * 格式化日志消息
   * @param {string} level - 日志级别
   * @param {string} message - 日志消息
   * @param {Object} data - 附加数据
   * @returns {string} 格式化后的日志
   */
  formatMessage(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase().padEnd(5);
    
    let formattedMessage = `[${timestamp}] ${levelUpper} ${message}`;
    
    if (data && Object.keys(data).length > 0) {
      formattedMessage += ` | ${JSON.stringify(data)}`;
    }
    
    return formattedMessage;
  }

  /**
   * 获取控制台颜色
   * @param {string} level - 日志级别
   * @returns {string} ANSI颜色代码
   */
  getConsoleColor(level) {
    const colors = {
      error: '\x1b[31m',   // 红色
      warn: '\x1b[33m',    // 黄色
      info: '\x1b[36m',    // 青色
      debug: '\x1b[37m'    // 白色
    };
    return colors[level] || colors.info;
  }

  /**
   * 写入日志
   * @param {string} level - 日志级别
   * @param {string} message - 日志消息
   * @param {Object} data - 附加数据
   */
  async log(level, message, data = {}) {
    if (this.levels[level] > this.currentLevel) {
      return; // 跳过低于当前级别的日志
    }

    const formattedMessage = this.formatMessage(level, message, data);
    
    // 控制台输出
    if (this.enableConsole) {
      const color = this.getConsoleColor(level);
      const reset = '\x1b[0m';
      console.log(`${color}${formattedMessage}${reset}`);
    }
    
    // 文件输出
    if (this.enableFile) {
      try {
        const logFilePath = path.join(this.outputDir, this.filename);
        await fs.appendFile(logFilePath, formattedMessage + '\n', 'utf-8');
      } catch (error) {
        console.error('写入日志文件失败:', error.message);
      }
    }
  }

  /**
   * 错误日志
   * @param {string} message - 日志消息
   * @param {Object} data - 附加数据
   */
  async error(message, data = {}) {
    await this.log('error', message, data);
  }

  /**
   * 警告日志
   * @param {string} message - 日志消息
   * @param {Object} data - 附加数据
   */
  async warn(message, data = {}) {
    await this.log('warn', message, data);
  }

  /**
   * 信息日志
   * @param {string} message - 日志消息
   * @param {Object} data - 附加数据
   */
  async info(message, data = {}) {
    await this.log('info', message, data);
  }

  /**
   * 调试日志
   * @param {string} message - 日志消息
   * @param {Object} data - 附加数据
   */
  async debug(message, data = {}) {
    await this.log('debug', message, data);
  }

  /**
   * 记录性能指标
   * @param {string} operation - 操作名称
   * @param {number} duration - 持续时间（毫秒）
   * @param {Object} metadata - 元数据
   */
  async performance(operation, duration, metadata = {}) {
    await this.info(`Performance: ${operation}`, {
      duration: `${duration}ms`,
      ...metadata
    });
  }

  /**
   * 记录API调用
   * @param {string} service - 服务名称
   * @param {string} endpoint - 端点
   * @param {number} statusCode - 状态码
   * @param {number} duration - 持续时间
   * @param {Object} metadata - 元数据
   */
  async apiCall(service, endpoint, statusCode, duration, metadata = {}) {
    const level = statusCode >= 400 ? 'error' : 'info';
    await this.log(level, `API Call: ${service}`, {
      endpoint,
      statusCode,
      duration: `${duration}ms`,
      ...metadata
    });
  }

  /**
   * 记录用户操作
   * @param {string} action - 操作名称
   * @param {Object} details - 操作详情
   */
  async userAction(action, details = {}) {
    await this.info(`User Action: ${action}`, details);
  }

  /**
   * 记录系统事件
   * @param {string} event - 事件名称
   * @param {Object} details - 事件详情
   */
  async systemEvent(event, details = {}) {
    await this.info(`System Event: ${event}`, details);
  }

  /**
   * 创建子日志记录器
   * @param {string} prefix - 前缀
   * @returns {Object} 子日志记录器
   */
  createChild(prefix) {
    const parent = this;
    
    return {
      error: (message, data) => parent.error(`[${prefix}] ${message}`, data),
      warn: (message, data) => parent.warn(`[${prefix}] ${message}`, data),
      info: (message, data) => parent.info(`[${prefix}] ${message}`, data),
      debug: (message, data) => parent.debug(`[${prefix}] ${message}`, data),
      performance: (operation, duration, metadata) => 
        parent.performance(`[${prefix}] ${operation}`, duration, metadata),
      apiCall: (service, endpoint, statusCode, duration, metadata) => 
        parent.apiCall(`[${prefix}] ${service}`, endpoint, statusCode, duration, metadata)
    };
  }

  /**
   * 设置日志级别
   * @param {string} level - 新的日志级别
   */
  setLevel(level) {
    if (this.levels.hasOwnProperty(level)) {
      this.logLevel = level;
      this.currentLevel = this.levels[level];
      this.info(`Log level changed to: ${level}`);
    } else {
      this.warn(`Invalid log level: ${level}`);
    }
  }

  /**
   * 获取日志文件路径
   * @returns {string} 日志文件完整路径
   */
  getLogFilePath() {
    return path.join(this.outputDir, this.filename);
  }

  /**
   * 清理旧日志文件
   * @param {number} daysToKeep - 保留天数
   */
  async cleanupOldLogs(daysToKeep = 30) {
    try {
      const files = await fs.readdir(this.outputDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      for (const file of files) {
        if (file.endsWith('.log')) {
          const filePath = path.join(this.outputDir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            this.info(`Cleaned up old log file: ${file}`);
          }
        }
      }
    } catch (error) {
      this.error('Failed to cleanup old logs', { error: error.message });
    }
  }

  /**
   * 获取日志统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getLogStats() {
    try {
      const logFilePath = this.getLogFilePath();
      
      try {
        const content = await fs.readFile(logFilePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        
        const stats = {
          totalLines: lines.length,
          errorCount: lines.filter(line => line.includes('ERROR')).length,
          warnCount: lines.filter(line => line.includes('WARN')).length,
          infoCount: lines.filter(line => line.includes('INFO')).length,
          debugCount: lines.filter(line => line.includes('DEBUG')).length
        };
        
        return stats;
      } catch (fileError) {
        return {
          totalLines: 0,
          errorCount: 0,
          warnCount: 0,
          infoCount: 0,
          debugCount: 0
        };
      }
    } catch (error) {
      this.error('Failed to get log stats', { error: error.message });
      return null;
    }
  }
}

/**
 * 创建默认日志记录器实例
 * @param {Object} options - 配置选项
 * @returns {Logger} 日志记录器实例
 */
export function createLogger(options = {}) {
  return new Logger(options);
}

/**
 * 性能计时器工具
 */
export class PerformanceTimer {
  constructor(logger, operation) {
    this.logger = logger;
    this.operation = operation;
    this.startTime = Date.now();
  }

  /**
   * 结束计时并记录
   * @param {Object} metadata - 附加元数据
   */
  async end(metadata = {}) {
    const duration = Date.now() - this.startTime;
    await this.logger.performance(this.operation, duration, metadata);
    return duration;
  }
}

/**
 * 创建性能计时器
 * @param {Logger} logger - 日志记录器
 * @param {string} operation - 操作名称
 * @returns {PerformanceTimer} 计时器实例
 */
export function createTimer(logger, operation) {
  return new PerformanceTimer(logger, operation);
}