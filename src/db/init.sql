-- ==========================================================
-- 课堂学生行为分析系统 - 数据库初始化脚本 (V2 修复版)
-- ==========================================================

-- 1. 创建并切换数据库
CREATE DATABASE IF NOT EXISTS `smart_classroom_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `smart_classroom_db`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ==========================================================
-- 2. 清理旧表 (按依赖顺序反向删除，支持反复执行)
-- ==========================================================
DROP TABLE IF EXISTS `analysis_detail`;
DROP TABLE IF EXISTS `analysis_task`;
DROP TABLE IF EXISTS `sys_weight_config`;
DROP TABLE IF EXISTS `course_schedule`;
DROP TABLE IF EXISTS `classroom`;
DROP TABLE IF EXISTS `course`;
DROP TABLE IF EXISTS `teacher`;

-- ==========================================================
-- 3. 创建表结构
-- ==========================================================

-- 教师表 (已修复：增加 password 字段)
CREATE TABLE `teacher` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `emp_no` varchar(50) NOT NULL COMMENT '教师工号(登录账号)',
  `password` varchar(100) NOT NULL COMMENT '登录密码(存MD5或BCrypt密文)',
  `name` varchar(50) NOT NULL COMMENT '教师姓名',
  `phone` varchar(20) DEFAULT NULL COMMENT '联系电话',
  `department` varchar(100) DEFAULT NULL COMMENT '所属教学部门',
  `role` tinyint(4) NOT NULL DEFAULT '0' COMMENT '角色：0-普通老师, 1-超级管理员',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '状态：1-正常, 0-禁用',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_emp_no` (`emp_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教师信息表';

-- 课程表
CREATE TABLE `course` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `course_no` varchar(50) NOT NULL COMMENT '课程编号',
  `name` varchar(100) NOT NULL COMMENT '课程名称',
  `department` varchar(100) DEFAULT NULL COMMENT '所属教学部门',
  `hours` int(11) DEFAULT '0' COMMENT '总学时',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '状态：1-正常, 0-停课',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_course_no` (`course_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程信息表';

-- 教室表
CREATE TABLE `classroom` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `room_no` varchar(50) NOT NULL COMMENT '教室编号(如A101)',
  `name` varchar(100) NOT NULL COMMENT '教室名称',
  `location` varchar(100) DEFAULT NULL COMMENT '具体位置',
  `capacity` int(11) DEFAULT '0' COMMENT '容纳人数',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '状态：1-可用, 0-维护中',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_room_no` (`room_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教室信息表';

-- 课程安排表 (排课表)
CREATE TABLE `course_schedule` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `course_id` bigint(20) NOT NULL COMMENT '关联课程ID',
  `classroom_id` bigint(20) NOT NULL COMMENT '关联教室ID',
  `teacher_id` bigint(20) NOT NULL COMMENT '关联教师ID',
  `student_count` int(11) NOT NULL DEFAULT '0' COMMENT '应到学生人数',
  `start_time` datetime NOT NULL COMMENT '上课开始时间',
  `end_time` datetime NOT NULL COMMENT '下课结束时间',
  `status` tinyint(4) NOT NULL DEFAULT '0' COMMENT '状态：0-未开始, 1-进行中, 2-已结束',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_teacher_id` (`teacher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='排课安排表';

-- 系统行为权重配置方案表 (多套方案单项激活)
CREATE TABLE `sys_weight_config` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `config_name` varchar(100) NOT NULL COMMENT '配置方案名称(如：严格模式)',
  `is_active` tinyint(2) NOT NULL DEFAULT '0' COMMENT '是否激活：1-已激活, 0-未激活 (全局有且仅有1条记录为1)',
  `config_content` json NOT NULL COMMENT '配置明文参数(包含多种行为的具体权重)',
  `description` varchar(255) DEFAULT NULL COMMENT '说明',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='行为评分权重配置方案表';

-- 分析任务主表
CREATE TABLE `analysis_task` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `teacher_id` bigint(20) NOT NULL,
  `schedule_id` bigint(20) NOT NULL,
  `media_type` tinyint(4) NOT NULL COMMENT '1-图片, 2-视频, 3-实时流',
  `media_url` varchar(500) DEFAULT NULL COMMENT '文件本地映射URL',
  `status` tinyint(4) NOT NULL DEFAULT '0' COMMENT '0-排队中, 1-分析中, 2-成功, 3-失败',
  `attendance_count` int(11) DEFAULT '0' COMMENT 'AI识别实到人数',
  `total_score` decimal(5,2) DEFAULT '0.00' COMMENT '综合得分',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI分析任务主表';

-- 分析任务明细表
CREATE TABLE `analysis_detail` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `task_id` bigint(20) NOT NULL,
  `frame_time` int(11) DEFAULT '0' COMMENT '视频帧秒数(图片为0)',
  `behavior_type` varchar(50) NOT NULL COMMENT '行为类别(英文)',
  `count` int(11) NOT NULL DEFAULT '0' COMMENT '出现人数',
  `bounding_boxes` json DEFAULT NULL COMMENT 'YOLO坐标数组',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI分析任务识别明细表';

-- ==========================================================
-- 4. 插入模拟数据 (Mock Data)
-- ==========================================================

-- 插入账号数据：1个超级管理员，2个普通老师
INSERT INTO `teacher` (`id`, `emp_no`, `password`, `name`, `phone`, `department`, `role`) VALUES
(1, 'admin', '123456', '超级管理员', '13800000000', '信息中心', 1),
(2, 'T202401', '123456', '张老师', '13911112222', '计算机学院', 0),
(3, 'T202402', '123456', '李老师', '13933334444', '理学院', 0);

-- 插入课程数据
INSERT INTO `course` (`id`, `course_no`, `name`, `department`, `hours`) VALUES
(1, 'C001', '数据结构与算法', '计算机学院', 48),
(2, 'C002', '大学物理', '理学院', 64);

-- 插入教室数据
INSERT INTO `classroom` (`id`, `room_no`, `name`, `location`, `capacity`) VALUES
(1, 'A101', '多媒体阶梯教室A101', '一教1楼', 60),
(2, 'B205', '普通教室B205', '二教2楼', 40);

-- 插入排课数据 (张老师在A101上数据结构)
INSERT INTO `course_schedule` (`id`, `course_id`, `classroom_id`, `teacher_id`, `student_count`, `start_time`, `end_time`, `status`) VALUES
(1, 1, 1, 2, 50, '2024-05-20 08:00:00', '2024-05-20 09:40:00', 2),
(2, 2, 2, 3, 38, '2024-05-20 10:00:00', '2024-05-20 11:40:00', 1);

-- 插入系统权重配置方案 Mock 数据 (仅能有一套方案是 is_active=1)
INSERT INTO `sys_weight_config` (`id`, `config_name`, `is_active`, `config_content`, `description`) VALUES
(1, '日常标准评分方案', 1, '[{"behaviorType":"listening","name":"听讲","weight":5},{"behaviorType":"playing_phone","name":"玩手机","weight":-10}]', '系统初始化的日常授课加减分模式'),
(2, '严格期末考试模式', 0, '[{"behaviorType":"listening","name":"听讲","weight":2},{"behaviorType":"playing_phone","name":"作弊/玩手机","weight":-50}]', '应用于严肃考场的重度扣分方案');

-- 插入一条模拟的 AI 分析任务 (张老师发起的一张图片分析，状态为已完成)
INSERT INTO `analysis_task` (`id`, `teacher_id`, `schedule_id`, `media_type`, `media_url`, `status`, `attendance_count`, `total_score`) VALUES
(1, 2, 1, 1, '/uploads/mock/classroom_sample.jpg', 2, 48, 82.50);

-- 插入该次任务的 AI 分析明细结果 (附带模拟的 YOLO JSON 坐标)
INSERT INTO `analysis_detail` (`task_id`, `frame_time`, `behavior_type`, `count`, `bounding_boxes`) VALUES
(1, 0, 'listening', 30, '[{"box": [120, 200, 180, 260], "conf": 0.95}, {"box": [220, 200, 280, 260], "conf": 0.92}]'),
(1, 0, 'playing_phone', 2, '[{"box": [500, 400, 560, 480], "conf": 0.88}, {"box": [600, 410, 650, 490], "conf": 0.85}]'),
(1, 0, 'sleeping', 1, '[{"box": [800, 300, 880, 350], "conf": 0.91}]'),
(1, 0, 'raising_hand', 3, '[{"box": [300, 150, 360, 240], "conf": 0.89}]');

SET FOREIGN_KEY_CHECKS = 1;