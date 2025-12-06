-- 添加编辑器数据字段到 translations 表
-- 用于存储阿里云图片翻译编辑器的图层 JSON 数据

ALTER TABLE translations ADD COLUMN editor_data TEXT;
ALTER TABLE translations ADD COLUMN inpainting_url VARCHAR(512);
