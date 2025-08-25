/**
 * 数据库服务模块
 * 功能：管理PostgreSQL数据库连接和操作
 */

import { Pool } from 'pg';
import { put } from '@vercel/blob';

export class DatabaseService {
  constructor(connectionString) {
    if (!connectionString) {
      throw new Error('Database connection string is required');
    }

    this.pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    this.isInitialized = false;
  }

  /**
   * 初始化数据库表结构
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('🗄️ 正在初始化数据库表结构...');

      const client = await this.pool.connect();
      
      try {
        // 创建财报记录表
        await client.query(`
          CREATE TABLE IF NOT EXISTS earnings_reports (
            id SERIAL PRIMARY KEY,
            ticker VARCHAR(10) NOT NULL,
            year INTEGER NOT NULL,
            quarter INTEGER NOT NULL CHECK (quarter >= 1 AND quarter <= 4),
            transcript TEXT NOT NULL,
            summary TEXT NOT NULL,
            audio_url TEXT,
            audio_size INTEGER,
            language VARCHAR(10) DEFAULT 'zh-CN',
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(ticker, year, quarter, language)
          )
        `);

        // 创建索引
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_earnings_ticker_period 
          ON earnings_reports(ticker, year, quarter)
        `);
        
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_earnings_created_at 
          ON earnings_reports(created_at DESC)
        `);

        // 创建更新时间触发器
        await client.query(`
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
          END;
          $$ language 'plpgsql'
        `);

        await client.query(`
          DROP TRIGGER IF EXISTS update_earnings_reports_updated_at ON earnings_reports
        `);
        
        await client.query(`
          CREATE TRIGGER update_earnings_reports_updated_at 
          BEFORE UPDATE ON earnings_reports 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        `);

        console.log('✅ 数据库表结构初始化完成');
        this.isInitialized = true;
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      console.error('❌ 数据库初始化失败:', error.message);
      throw error;
    }
  }

  /**
   * 保存财报记录
   * @param {Object} data - 财报数据
   * @returns {Promise<string>} 记录ID
   */
  async saveEarningsReport(data) {
    await this.initialize();

    const {
      ticker,
      year,
      quarter,
      transcript,
      summary,
      audioBuffer,
      language = 'zh-CN',
      metadata = {}
    } = data;

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      console.log(`💾 正在保存 ${ticker} ${year}Q${quarter} 财报记录...`);

      // 上传音频文件到Blob存储
      let audioUrl = null;
      let audioSize = 0;
      
      if (audioBuffer && audioBuffer.length > 0) {
        console.log('☁️ 正在上传音频文件到云存储...');
        
        const filename = `earnings-podcasts/${ticker}/${year}Q${quarter}-${language}-${Date.now()}.mp3`;
        
        try {
          const blob = await put(filename, audioBuffer, {
            access: 'public',
            contentType: 'audio/mpeg'
          });
          
          audioUrl = blob.url;
          audioSize = audioBuffer.length;
          
          console.log(`✅ 音频文件上传成功: ${audioUrl}`);
        } catch (uploadError) {
          console.warn('⚠️ 音频文件上传失败，将继续保存其他数据:', uploadError.message);
        }
      }

      // 检查是否已存在相同记录
      const existingRecord = await client.query(
        'SELECT id FROM earnings_reports WHERE ticker = $1 AND year = $2 AND quarter = $3 AND language = $4',
        [ticker.toUpperCase(), year, quarter, language]
      );

      let recordId;
      
      if (existingRecord.rows.length > 0) {
        // 更新现有记录
        console.log('📝 更新现有财报记录...');
        
        const result = await client.query(`
          UPDATE earnings_reports 
          SET transcript = $1, summary = $2, audio_url = $3, audio_size = $4, metadata = $5
          WHERE ticker = $6 AND year = $7 AND quarter = $8 AND language = $9
          RETURNING id
        `, [
          transcript,
          summary,
          audioUrl,
          audioSize,
          JSON.stringify(metadata),
          ticker.toUpperCase(),
          year,
          quarter,
          language
        ]);
        
        recordId = result.rows[0].id;
        
      } else {
        // 插入新记录
        console.log('📝 插入新财报记录...');
        
        const result = await client.query(`
          INSERT INTO earnings_reports 
          (ticker, year, quarter, transcript, summary, audio_url, audio_size, language, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id
        `, [
          ticker.toUpperCase(),
          year,
          quarter,
          transcript,
          summary,
          audioUrl,
          audioSize,
          language,
          JSON.stringify(metadata)
        ]);
        
        recordId = result.rows[0].id;
      }

      await client.query('COMMIT');
      
      console.log(`✅ 财报记录保存成功，ID: ${recordId}`);
      return recordId.toString();
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ 保存财报记录失败:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取财报记录
   * @param {Object} params - 查询参数
   * @returns {Promise<Object|null>} 财报记录
   */
  async getEarningsReport({ ticker, year, quarter, language = 'zh-CN' }) {
    await this.initialize();

    try {
      const result = await this.pool.query(`
        SELECT * FROM earnings_reports 
        WHERE ticker = $1 AND year = $2 AND quarter = $3 AND language = $4
      `, [ticker.toUpperCase(), year, quarter, language]);

      if (result.rows.length === 0) {
        return null;
      }

      const record = result.rows[0];
      return {
        id: record.id,
        ticker: record.ticker,
        year: record.year,
        quarter: record.quarter,
        transcript: record.transcript,
        summary: record.summary,
        audioUrl: record.audio_url,
        audioSize: record.audio_size,
        language: record.language,
        metadata: record.metadata,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      };
      
    } catch (error) {
      console.error('❌ 获取财报记录失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取公司的历史财报列表
   * @param {string} ticker - 股票代码
   * @param {string} language - 语言
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 财报记录列表
   */
  async getCompanyEarningsHistory(ticker, language = 'zh-CN', limit = 20) {
    await this.initialize();

    try {
      const result = await this.pool.query(`
        SELECT id, ticker, year, quarter, audio_url, audio_size, language, 
               metadata, created_at, updated_at
        FROM earnings_reports 
        WHERE ticker = $1 AND language = $2
        ORDER BY year DESC, quarter DESC
        LIMIT $3
      `, [ticker.toUpperCase(), language, limit]);

      return result.rows.map(record => ({
        id: record.id,
        ticker: record.ticker,
        year: record.year,
        quarter: record.quarter,
        audioUrl: record.audio_url,
        audioSize: record.audio_size,
        language: record.language,
        metadata: record.metadata,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      }));
      
    } catch (error) {
      console.error('❌ 获取公司财报历史失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取最近的财报记录
   * @param {number} limit - 限制数量
   * @param {string} language - 语言
   * @returns {Promise<Array>} 最近的财报记录
   */
  async getRecentEarningsReports(limit = 10, language = null) {
    await this.initialize();

    try {
      let query = `
        SELECT id, ticker, year, quarter, audio_url, audio_size, language, 
               metadata, created_at, updated_at
        FROM earnings_reports
      `;
      
      const params = [];
      
      if (language) {
        query += ' WHERE language = $1';
        params.push(language);
      }
      
      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
      params.push(limit);

      const result = await this.pool.query(query, params);

      return result.rows.map(record => ({
        id: record.id,
        ticker: record.ticker,
        year: record.year,
        quarter: record.quarter,
        audioUrl: record.audio_url,
        audioSize: record.audio_size,
        language: record.language,
        metadata: record.metadata,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      }));
      
    } catch (error) {
      console.error('❌ 获取最近财报记录失败:', error.message);
      throw error;
    }
  }

  /**
   * 删除财报记录
   * @param {string} id - 记录ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteEarningsReport(id) {
    await this.initialize();

    try {
      const result = await this.pool.query(
        'DELETE FROM earnings_reports WHERE id = $1 RETURNING id',
        [id]
      );

      return result.rows.length > 0;
      
    } catch (error) {
      console.error('❌ 删除财报记录失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取数据库统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getStatistics() {
    await this.initialize();

    try {
      const [totalCount, languageStats, recentStats] = await Promise.all([
        // 总记录数
        this.pool.query('SELECT COUNT(*) as total FROM earnings_reports'),
        
        // 按语言统计
        this.pool.query(`
          SELECT language, COUNT(*) as count 
          FROM earnings_reports 
          GROUP BY language
        `),
        
        // 最近30天统计
        this.pool.query(`
          SELECT COUNT(*) as recent_count 
          FROM earnings_reports 
          WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        `)
      ]);

      return {
        totalReports: parseInt(totalCount.rows[0].total),
        languageBreakdown: languageStats.rows.reduce((acc, row) => {
          acc[row.language] = parseInt(row.count);
          return acc;
        }, {}),
        recentReports: parseInt(recentStats.rows[0].recent_count)
      };
      
    } catch (error) {
      console.error('❌ 获取统计信息失败:', error.message);
      throw error;
    }
  }

  /**
   * 测试数据库连接
   * @returns {Promise<boolean>} 连接是否成功
   */
  async testConnection() {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('✅ 数据库连接测试成功');
      return true;
    } catch (error) {
      console.error('❌ 数据库连接测试失败:', error.message);
      return false;
    }
  }

  /**
   * 关闭数据库连接池
   */
  async close() {
    try {
      await this.pool.end();
      console.log('🔚 数据库连接池已关闭');
    } catch (error) {
      console.error('❌ 关闭数据库连接池失败:', error.message);
    }
  }
}