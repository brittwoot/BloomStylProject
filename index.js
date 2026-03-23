// Water Cycle Lesson Plan Generator
// Run: node index.js

function generateWaterCycleLesson() {
  return {
    title: "The Water Cycle",
    grade_level: "5th Grade",
    objective: "Students will be able to describe the stages of the water cycle and explain how water moves through Earth’s systems.",

    standards: [
      "NGSS 5-ESS2-1: Develop a model to describe the movement of water among Earth's systems"
    ],

    materials: [
      "Water cycle diagram",
      "Whiteboard / markers",
      "Clear plastic bag",
      "Water",
      "Tape",
      "Blue food coloring (optional)",
      "Worksheet (optional)"
    ],

    lesson_sections: [
      {
        section: "Warm-Up (5-10 min)",
        content: [
          "Ask: 'Where does rain come from?'",
          "Think-Pair-Share",
          "List student ideas on the board"
        ]
      },

      {
        section: "Direct Instruction (10-15 min)",
        content: [
          "Introduce the water cycle",
          "Explain key vocabulary:",
          "- Evaporation: water turns into vapor",
          "- Condensation: vapor turns into clouds",
          "- Precipitation: rain, snow, sleet, hail",
          "- Collection: water gathers in oceans, lakes, rivers",
          "Show diagram and label each part"
        ]
      },

      {
        section: "Guided Practice (15 min)",
        content: [
          "Students label a water cycle diagram",
          "Teacher checks for understanding",
          "Discuss each stage as a class"
        ]
      },

      {
        section: "Hands-On Activity (20 min)",
        content: [
          "Create a mini water cycle in a bag:",
          "1. Add water to a plastic bag",
          "2. Add food coloring (optional)",
          "3. Tape to a sunny window",
          "4. Observe evaporation and condensation over time"
        ]
      },

      {
        section: "Independent Practice (10-15 min)",
        content: [
          "Students answer questions:",
          "1. What is evaporation?",
          "2. What happens during condensation?",
          "3. What are examples of precipitation?",
          "4. Draw and label the water cycle"
        ]
      },

      {
        section: "Assessment",
        content: [
          "Exit Ticket:",
          "Explain the water cycle in 3-4 sentences",
          "Use at least 2 vocabulary words"
        ]
      },

      {
        section: "Differentiation",
        content: [
          "Support: Provide labeled diagram + word bank",
          "Advanced: Have students explain energy from the sun’s role",
          "ELD: Sentence frames (\"Water evaporates when...\")"
        ]
      }
    ]
  };
}

// Run and print
const lesson = generateWaterCycleLesson();
console.log(JSON.stringify(lesson, null, 2));