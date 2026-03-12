PROJECT NAME: BloomStyl

These instructions define the rules, architecture, and behavior for the BloomStyl project. Follow these instructions whenever generating or modifying code for this project.

BloomStyl is an AI-powered educational content transformation platform that converts teacher-provided lesson materials into structured, visually engaging, classroom-safe worksheets.

The goal of the system is to help teachers quickly transform lesson content into student-ready worksheets while maintaining teacher control over the final output.

Teachers should be able to:

1. Upload or paste lesson content
2. Allow AI to detect instructional sections
3. Choose which sections to include
4. Generate a worksheet
5. Preview and edit the worksheet
6. Export the worksheet

The AI system must assist teachers but never replace teacher decision making.

--------------------------------------------------

CORE PRODUCT PRINCIPLES

Teacher Control

Teachers must always control:
- what content is included
- worksheet structure
- acceptance of AI suggestions
- final worksheet output

AI must never silently insert generated content.

Teacher Intent Preservation

Uploaded content should primarily be:
- extracted
- organized
- formatted
- structured

The system should not rewrite teacher content unless the teacher explicitly asks for AI assistance.

--------------------------------------------------

CONTENT BLOCK ARCHITECTURE

All uploaded instructional material must be converted into modular content blocks.

Each block must use this structure:

{
  id: string
  type: string
  page: number
  label: string
  text: string
  is_selected: boolean
  order: number
}

Supported block types include:

title
directions
passage
questions
vocabulary
teacher_notes
activity
objective
table
image_reference
extra

This block system must be used consistently across:
- AI detection
- UI rendering
- database storage
- worksheet generation
- preview editing

--------------------------------------------------

WORKSHEET DATA MODEL

The system must maintain a master worksheet schema.

Example structure:

{
  worksheet_id: string
  title: string
  language: string
  template_type: string
  theme: string
  settings: {}
  sections: []
  answer_key: {}
  export_options: {}
}

All worksheet generation must update this schema.

--------------------------------------------------

AI SYSTEM ARCHITECTURE

AI must operate in separate steps.

Step 1: Content Detection

Detect instructional sections including:
title
directions
passage
questions
vocabulary
teacher notes

Return structured content blocks.

Step 2: Worksheet Structuring

Convert selected blocks into the worksheet schema and organize them logically.

Step 3: Quality Validation

Before previewing the worksheet verify:
- directions clarity
- question relevance
- grammar
- answer accuracy
- formatting consistency
- grade-level appropriateness

Step 4: Optional Gap-Fill Suggestions

AI may suggest missing content such as:
- directions
- questions
- answers
- passages
- vocabulary definitions
- image suggestions

All AI generated suggestions must:
- be labeled as AI Suggested
- require teacher approval
- remain editable before use

--------------------------------------------------

SAFETY REQUIREMENTS

The system must block or flag any content containing:

sexual content
graphic violence
hate speech
self-harm
illegal instruction
explicit profanity
age-inappropriate material

Safety checks must run on:
- uploaded content
- AI generated content
- AI suggestions

Unsafe content must be blocked or flagged for review.

--------------------------------------------------

MVP USER WORKFLOW

The first version must follow this flow:

Upload
→ Content Detection
→ Worksheet Settings
→ Preview / Export

Do not introduce unnecessary screens.

--------------------------------------------------

UPLOAD PAGE REQUIREMENTS

Teachers must be able to:

paste lesson text
upload PDF
upload DOCX

Include language selector:
Auto Detect
English
Vietnamese

Uploaded documents may have messy formatting and must still be processed.

--------------------------------------------------

CONTENT DETECTION PAGE

Display detected content blocks with:

preview snippet
page number
block type
include/exclude toggle

Teachers must be able to:

select blocks
deselect blocks
reorder blocks

--------------------------------------------------

WORKSHEET SETTINGS PAGE

Allow teachers to configure:

Template Type
Reading Worksheet
Practice Worksheet
Vocabulary Worksheet

Layout Options
Include Name Line
Include Date Line
Generate Answer Key

Themes
Clean
Classroom
Fun

Advanced options should remain hidden initially but supported later.

--------------------------------------------------

PREVIEW PAGE

Teachers must be able to:

reorder sections
edit text inline
adjust question order
change theme
review writing space
export worksheet

The preview must represent the final layout.

--------------------------------------------------

TEMPLATE SYSTEM

MVP templates include:

Reading Worksheet
Practice Worksheet
Vocabulary Worksheet

Each template supports:
title
directions
passage
question area
writing space
optional vocabulary section

--------------------------------------------------

QUESTION MODEL

Questions must use structured objects.

Example:

{
  id: string
  text: string
  question_type: string
  difficulty_level: string
  answer: string
  points: number
  order: number
}

Multiple choice questions must support:

choices
correct_answer
display_choice_count

--------------------------------------------------

VOCABULARY MODEL

Vocabulary entries must support:

{
  id: string
  word: string
  definition: string
  order: number
}

Future fields may include:
example_sentence
translation
image_hint
difficulty_level

--------------------------------------------------

BACKEND DATA STORAGE

The system must store:

users
uploaded_documents
worksheets
worksheet_content_blocks
worksheet_versions
answer_keys
ai_suggestions
safety_reviews

Use JSON for flexible structures such as:
worksheet schema
question arrays
vocabulary arrays
settings

--------------------------------------------------

VERSIONING

Meaningful worksheet edits must create version records to support:

undo
history
debugging
remixing

--------------------------------------------------

PRIVACY

Users must only access their own data.

Protect:

uploaded documents
worksheets
content blocks
answer keys
AI suggestions
safety reviews

--------------------------------------------------

ENGINEERING GUIDELINES

Build the system in this order:

1 UI skeleton
2 upload system
3 document processing
4 AI content detection
5 content selection
6 worksheet settings
7 worksheet generation
8 preview editing
9 export
10 answer key
11 AI suggestions
12 advanced features

--------------------------------------------------

CODE ORGANIZATION

Project structure should remain modular:

app/
components/
lib/ai/
lib/processing/
lib/templates/
api/
database/
utils/
styles/

--------------------------------------------------

AI COST OPTIMIZATION

Use AI efficiently:

send cleaned text
limit document size
reuse prompts
only generate suggestions when requested

--------------------------------------------------

MVP SUCCESS CRITERIA

The MVP is successful when a teacher can:

1 paste or upload lesson content
2 review detected sections
3 select what to include
4 generate a worksheet
5 preview and edit it
6 export the worksheet