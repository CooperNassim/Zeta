ALTER TABLE data_sync_history ALTER COLUMN data_source_id DROP NOT NULL;
ALTER TABLE data_sync_history ALTER COLUMN data_source_id SET DEFAULT NULL;
;
COMMENT ON COLUMN data_sync_history.data_source_id IS '数据源ID（可选，已废弃，使用provider字段替代）';
