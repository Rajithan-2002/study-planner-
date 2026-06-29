-- Enable pgvector
create extension if not exists vector with schema public;

-- ENUMS
create type module_status as enum ('NOT_STARTED', 'ONGOING', 'EXAM_PENDING', 'RESULT_PENDING', 'COMPLETED', 'REPEAT');
create type project_status as enum ('IDEA', 'RESEARCHING', 'ACTIVE', 'COMPLETED', 'ARCHIVED');
create type cert_status as enum ('IDEA', 'ACTIVE', 'COMPLETED', 'ARCHIVED');
create type session_type as enum ('LECTURE', 'LAB', 'PRACTICAL', 'TUTORIAL');
create type discussion_entity_type as enum ('PROJECT', 'CERTIFICATION', 'MODULE', 'CAREER', 'DOMAIN');
create type event_type as enum ('EXAM', 'ASSIGNMENT', 'CERT_EXAM', 'PROJECT_MILESTONE', 'COMPETITION', 'INTERNSHIP_DEADLINE');
create type resource_type as enum ('COURSE', 'PRACTICE_EXAM', 'YOUTUBE', 'PDF');
create type knowledge_entity_type as enum ('MODULE', 'PROJECT', 'CERTIFICATION', 'INBOX');
