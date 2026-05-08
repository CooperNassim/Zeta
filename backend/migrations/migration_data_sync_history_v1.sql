CREATE TABLE IF NOT EXISTS data_sync_history (
    id SERIAL PRIMARY KEY,
    market VARCHAR(20) NOT NULL,
    data_source_id INTEGER NOT NULL,
    sync_type VARCHAR(30) NOT NULL DEFAULT 'full',
    total_count INTEGER NOT NULL DEFAULT 0,
    new_count INTEGER NOT NULL DEFAULT 0,
    updated_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'running',
    error_message TEXT,
    started_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_data_source FOREIGN KEY (data_source_id) REFERENCES data_sources(id) ON DELETE SET NULL
);
;
CREATE INDEX IF NOT EXISTS data_sync_history_market_idx ON data_sync_history (market);
;
CREATE INDEX IF NOT EXISTS data_sync_history_status_idx ON data_sync_history (status);
;
CREATE INDEX IF NOT EXISTS data_sync_history_started_at_idx ON data_sync_history (started_at DESC);
;
CREATE INDEX IF NOT EXISTS data_sync_history_data_source_id_idx ON data_sync_history (data_source_id);
;
CREATE TRIGGER update_data_sync_history_updated_at BEFORE UPDATE ON data_sync_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
;
COMMENT ON TABLE data_sync_history IS '数据同步历史表';
;
COMMENT ON COLUMN data_sync_history.market IS '市场类型：A股/美股/港股';
;
COMMENT ON COLUMN data_sync_history.data_source_id IS '数据源ID';
;
COMMENT ON COLUMN data_sync_history.sync_type IS '同步类型：full-全量同步, incremental-增量同步';
;
COMMENT ON COLUMN data_sync_history.total_count IS '总同步数量';
;
COMMENT ON COLUMN data_sync_history.new_count IS '新增数量';
;
COMMENT ON COLUMN data_sync_history.updated_count IS '更新数量';
;
COMMENT ON COLUMN data_sync_history.failed_count IS '失败数量';
;
COMMENT ON COLUMN data_sync_history.status IS '状态：running/success/failed';
;
COMMENT ON COLUMN data_sync_history.error_message IS '错误信息';
;
COMMENT ON COLUMN data_sync_history.started_at IS '开始时间';
;
COMMENT ON COLUMN data_sync_history.completed_at IS '完成时间';
