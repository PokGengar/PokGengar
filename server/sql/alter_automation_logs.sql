-- 修改日志字段类型为 LONGTEXT
ALTER TABLE automation_tasks
  MODIFY COLUMN change_log LONGTEXT,
  MODIFY COLUMN verify_log LONGTEXT;
