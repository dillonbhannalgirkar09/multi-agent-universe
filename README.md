# 🌌 Multi-Agent Universe using Claude

A production-quality, dynamic multi-agent system where AI agents collaborate intelligently to solve complex software development tasks. Unlike traditional fixed pipelines, this system uses an orchestrator-driven approach where agents make decisions about what to do next based on the current state.

## 🏗️ Architecture

### Core Philosophy

This system implements **true dynamic orchestration** - agents don't follow a predetermined sequence. Instead:

1. The **Orchestrator** analyzes the current state
2. Makes an intelligent decision about the next action
3. Delegates to the appropriate specialist agent
4. Updates shared state with results
5. Repeats until task completion

### Agent Roles

#### 🎯 Orchestrator Agent
- **Role**: Strategic decision-maker
- **Responsibilities**: 
  - Analyze system state
  - Decide next action (PLAN, RESEARCH, CODE, REVIEW, REFINE_PLAN, DONE)
  - Ensure task completion criteria are met
- **Key Feature**: No hardcoded sequences - purely decision-driven

#### 📋 Planner Agent
- **Role**: Task decomposition specialist
- **Responsibilities**:
  - Break complex requests into actionable steps
  - Create/refine project plans
  - Adapt plans based on learnings
- **Output**: Structured plan with clear steps and goals

#### 🔬 Researcher Agent
- **Role**: Best practices and architecture expert
- **Responsibilities**:
  - Gather industry best practices
  - Recommend architectural patterns
  - Identify potential pitfalls
- **Output**: Research insights and recommendations

#### 💻 Coder Agent
- **Role**: Software developer
- **Responsibilities**:
  - Generate production-quality code
  - Implement features following best practices
  - Address review feedback
- **Output**: Complete code files with explanations

#### ✅ Reviewer Agent
- **Role**: Quality assurance specialist
- **Responsibilities**:
  - Review code quality
  - Identify issues and improvements
  - Rate code quality (1-10)
  - Optionally provide improved code
- **Output**: Detailed review with ratings and suggestions

### System Flow