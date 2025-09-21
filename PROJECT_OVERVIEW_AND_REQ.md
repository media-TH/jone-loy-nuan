# 📊 Scam Awareness System - Complete Diagrams

## 🔄 1. Data Flow Diagram (DFD) - ระบบการทำงาน

```mermaid
flowchart TD
    %% User Journey
    A[👤 User เข้าใช้งาน] --> B[🆔 Create Session]
    B --> C[📋 ทำ Quiz 10 ข้อ]
    C --> D[💾 Save Individual Response<br/>+ KPI Category]
    D --> E{มีคำถามถัดไป?}
    E -->|ใช่| C
    E -->|ไม่| F[📊 Calculate KPI Real-time]
    
    %% KPI Processing
    F --> G[🎯 4 KPI Categories<br/>Target: 80% each]
    G --> H[📈 Total Summary Score: 0-100%]
    H --> I[🎊 Show Results]
    
    %% Survey & Analytics
    I --> J[📋 Demographics Survey]
    J --> K[📊 Admin Dashboard]
    K --> L[🏦 Export to ธปท.]
    
    %% Database Operations
    D --> DB1[(quiz_sessions)]
    D --> DB2[(question_responses)]
    J --> DB3[(survey_responses)]
    
    %% Analytics Views
    DB1 --> V1[quiz_kpi_summary]
    DB2 --> V1
    DB2 --> V2[question_difficulty_analysis]
    V1 --> K
    V2 --> K
    
    %% Styling
    classDef user fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef process fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef database fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef analytics fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    
    class A,C,I,J user
    class B,D,F,G,H,L process
    class DB1,DB2,DB3 database
    class V1,V2,K analytics
```

## 👤 2. User Flow Diagram - การใช้งานของผู้ใช้

```mermaid
flowchart TD
    %% Entry Points
    START[🌐 เข้าเว็บไซต์] --> LANDING[📄 Landing Page]
    LANDING --> INTRO[📖 คำแนะนำการทำ Quiz]
    INTRO --> READY{พร้อมทำ Quiz?}
    
    %% Quiz Flow
    READY -->|ใช่| Q1[❓ คำถามที่ 1<br/>SCAM_RECOGNITION]
    READY -->|ไม่| INTRO
    
    Q1 --> A1[✅ เลือกคำตอบ]
    A1 --> R1[📊 แสดงผลลัพธ์ + คำอธิบาย]
    R1 --> NEXT1{ข้อถัดไป}
    
    NEXT1 --> Q2[❓ คำถามที่ 2-10<br/>RISK_ASSESSMENT<br/>PROTECTIVE_ACTIONS<br/>RESPONSE_STRATEGIES]
    Q2 --> A2[✅ เลือกคำตอบ]
    A2 --> R2[📊 แสดงผลลัพธ์]
    R2 --> CONTINUE{ครบ 10 ข้อ?}
    
    CONTINUE -->|ไม่| Q2
    CONTINUE -->|ใช่| SUMMARY[🎯 สรุปผลคะแนน<br/>4 หมวด KPI + คะแนนรวม]
    
    %% Survey Flow
    SUMMARY --> SURVEY_START[📋 แบบสำรวจข้อมูลส่วนตัว]
    SURVEY_START --> AGE[👤 ช่วงอายุ]
    AGE --> EDU[🎓 การศึกษา]
    EDU --> JOB[💼 อาชีพ]
    JOB --> SUBMIT[📤 ส่งข้อมูล]
    
    %% Completion
    SUBMIT --> THANKS[🙏 ขอบคุณที่ร่วมทำแบบทดสอบ]
    THANKS --> RESOURCES[📚 แหล่งข้อมูลเพิ่มเติม]
    RESOURCES --> END[🏁 จบการใช้งาน]
    
    %% Alternative Paths
    SUMMARY --> SKIP[⏭️ ข้ามแบบสำรวจ]
    SKIP --> THANKS
    
    %% Admin Path
    START --> ADMIN_LOGIN[🔐 Admin Login]
    ADMIN_LOGIN --> DASHBOARD[📊 Dashboard]
    DASHBOARD --> ANALYTICS[📈 KPI Analytics]
    ANALYTICS --> EXPORT[📁 Export Data]
    
    %% Styling
    classDef entry fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef quiz fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef survey fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef completion fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef admin fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    
    class START,LANDING,INTRO entry
    class Q1,Q2,A1,A2,R1,R2,SUMMARY quiz
    class SURVEY_START,AGE,EDU,JOB survey
    class THANKS,RESOURCES,END completion
    class ADMIN_LOGIN,DASHBOARD,ANALYTICS,EXPORT admin
```

## 🗄️ 3. Entity Relationship Diagram (ERD) - โครงสร้างฐานข้อมูล

```mermaid
erDiagram
    %% Core Quiz Tables
    quiz_sessions {
        uuid id PK
        varchar session_id UK
        varchar anonymous_user_id
        integer total_questions
        integer completed_questions
        integer correct_answers
        numeric total_summary_score
        boolean is_completed
        integer completion_time_ms
        timestamp created_at
        timestamp expires_at
    }
    
    questions {
        uuid id PK
        integer order_index
        text question_text
        uuid kpi_category_id FK
        jsonb content
        jsonb result
        timestamp created_at
        timestamp updated_at
    }    
    answers {
        uuid id PK
        uuid question_id FK
        text answer_text
        boolean is_correct
        timestamp created_at
        timestamp updated_at
    }
    
    question_responses {
        uuid id PK
        uuid quiz_session_id FK
        uuid question_id FK
        uuid selected_answer_id FK
        boolean is_correct
        integer response_time_ms
        uuid kpi_category_id FK
        integer question_order
        timestamp created_at
    }    
    %% Survey & Analytics
    survey_responses {
        uuid id PK
        uuid quiz_session_id FK
        integer total_score
        integer total_questions
        text age_group
        text education
        text occupation
        timestamp created_at
    }
    
    kpi_target {
        bigint id PK
        text name
        text description
        numeric target_value
        text unit
        timestamp period_start
        timestamp period_end
        uuid quiz_session_id FK
        timestamp created_at
        timestamp updated_at
    }
    
    %% Support Tables
    red_flags {
        uuid id PK
        uuid question_id FK
        text flag_text
        timestamp created_at
    }
    
    scenario_images {
        uuid id PK
        uuid question_id FK
        text variant
        text image_url
        timestamp created_at
        timestamp updated_at
    }
    
    %% Analytics Views (Virtual Tables)
    quiz_kpi_summary {
        uuid quiz_session_id
        string session_id
        text anonymous_user_id
        timestamp created_at
        numeric scam_recognition_percentage
        numeric risk_assessment_percentage
        numeric protective_actions_percentage
        numeric response_strategies_percentage
        numeric overall_percentage
        integer total_answers_recorded
    }    
    question_difficulty_analysis {
        string question_id
        text question_text
        string kpi_category
        integer total_attempts
        numeric success_rate
        numeric failure_rate
        numeric avg_response_time_ms
    }
    
    %% Relationships
    quiz_sessions ||--o{ question_responses : "has many"
    quiz_sessions ||--o| survey_responses : "has one"
    quiz_sessions ||--o{ kpi_target : "has many"
    kpi_categories ||--o{ kpi_target : "targets"
    
    questions ||--o{ answers : "has many"
    questions ||--o{ question_responses : "answered in"
    questions ||--o{ red_flags : "has many"
    questions ||--o{ scenario_images : "has many"
    
    answers ||--o{ question_responses : "selected in"
    
    %% Virtual Relationships (Views)
    quiz_sessions ||..|| quiz_kpi_summary : "calculated from"
    question_responses ||..|| quiz_kpi_summary : "aggregated in"
    questions ||..|| question_difficulty_analysis : "analyzed in"
    question_responses ||..|| question_difficulty_analysis : "analyzed in"
```

## 📋 4. KPI Categories Mapping

```mermaid
mindmap
  root((🎯 KPI Structure))
    (🎯 SCAM_RECOGNITION)
      [3 questions]
      [Target: 80%]
      [ความสามารถจำแนกหลอกลวง]
    (⚖️ RISK_ASSESSMENT)
      [2 questions]
      [Target: 80%]
      [ประเมินระดับความเสี่ยง]
    (🛡️ PROTECTIVE_ACTIONS)
      [3 questions]
      [Target: 80%]
      [มาตรการป้องกัน]
    (🎯 RESPONSE_STRATEGIES)
      [2 questions]
      [Target: 80%]
      [กลยุทธ์การตอบสนอง]
```

## 🚀 5. System Architecture Overview

```mermaid
graph TB
    %% Frontend Layer
    subgraph "🖥️ Frontend (Next.js)"
        UI[User Interface]
        ADMIN[Admin Dashboard]
        SURVEY[Survey Forms]
    end
    
    %% Backend Layer
    subgraph "⚙️ Backend Services"
        API[API Routes]
        AUTH[Authentication]
        ANALYTICS[Analytics Service]
    end
    
    %% Database Layer
    subgraph "🗄️ Database (Supabase)"
        TABLES[Core Tables]
        VIEWS[Analytics Views]
        FUNCTIONS[SQL Functions]
        TRIGGERS[Auto Triggers]
    end
    
    %% External Integration
    subgraph "🏦 External Systems"
        BOT[ธปท. Reporting]
        EXPORT[Data Export]
    end
    
    %% Connections
    UI --> API
    ADMIN --> API
    SURVEY --> API
    
    API --> AUTH
    API --> ANALYTICS
    
    ANALYTICS --> TABLES
    TABLES --> VIEWS
    VIEWS --> FUNCTIONS
    FUNCTIONS --> TRIGGERS
    
    ADMIN --> BOT
    ANALYTICS --> EXPORT
    
    %% Styling
    classDef frontend fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef backend fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef database fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef external fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    
    class UI,ADMIN,SURVEY frontend
    class API,AUTH,ANALYTICS backend
    class TABLES,VIEWS,FUNCTIONS,TRIGGERS database
    class BOT,EXPORT external
```

---

## 📊 สรุปภาพรวมระบบ

**🎯 วัตถุประสงค์:** สร้างความตระหนักรู้เรื่อง SCAM Online และวัด KPI เพื่อส่งมอบให้ ธปท.

**👥 ผู้ใช้หลัก:** 
- ประชาชนทั่วไป (ทำ Quiz)
- ผู้ดูแลระบบ (ดู Analytics)
- ธปท. (รับรายงาน KPI)

**🔢 KPI หลัก:** 4 หมวด เป้าหมาย 80% แต่ละหมวด
- การจำแนกหลอกลวง
- การประเมินความเสี่ยง  
- มาตรการป้องกัน
- กลยุทธ์การตอบสนอง

**💾 ฐานข้อมูล:** PostgreSQL + Supabase
- ไม่ซ้ำซ้อน
- Real-time calculation
- Analytics-ready

**📊 Dashboard:** ShadCN + Recharts
- KPI monitoring
- Question analysis
- Export functionality












