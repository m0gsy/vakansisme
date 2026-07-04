ALTER TABLE expeditions ADD CONSTRAINT quota_min_3 CHECK (quota_max >= 3);
